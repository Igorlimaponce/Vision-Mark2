import pika
import os
import json
import logging
import time
import numpy as np
import cv2
from pipeline_executor import PipelineExecutor

# Configuration from environment variables (infrastructure only)
RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'rabbitmq')
RABBITMQ_PORT = int(os.getenv('RABBITMQ_PORT', '5672'))
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")
MODELS_PATH = os.getenv("MODELS_PATH", "/app/models")
USE_GPU = os.getenv("USE_GPU", "true").lower() == "true"
MAX_PROCESSING_TIME = float(os.getenv("MAX_PROCESSING_TIME", "5.0"))
PERFORMANCE_LOG_INTERVAL = int(os.getenv("PERFORMANCE_LOG_INTERVAL", "100"))

# Configure logging with more detail
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('/app/logs/frame_processing.log')
    ]
)
logger = logging.getLogger(__name__)

class FrameProcessingService:
    """
    Enhanced frame processing service with improved reliability,
    performance monitoring, and comprehensive error handling.
    """
    
    def __init__(self):
        self.connection_params = self._get_rabbitmq_connection_params()
        self.executor = PipelineExecutor(self.connection_params)
        self.stats = {
            'frames_processed': 0,
            'frames_failed': 0,
            'start_time': time.time(),
            'last_frame_time': 0
        }
        
        # Ensure log directory exists
        os.makedirs('/app/logs', exist_ok=True)
        
    def _get_rabbitmq_connection_params(self):
        """Get RabbitMQ connection parameters with retry configuration."""
        credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
        return pika.ConnectionParameters(
            host=RABBITMQ_HOST,
            port=RABBITMQ_PORT,
            credentials=credentials,
            heartbeat=600,
            blocked_connection_timeout=300
        )

    def _log_performance_stats(self):
        """Log performance statistics periodically."""
        runtime = time.time() - self.stats['start_time']
        fps = self.stats['frames_processed'] / runtime if runtime > 0 else 0
        
        logger.info(f"Performance Stats - "
                   f"Frames processed: {self.stats['frames_processed']}, "
                   f"Failed: {self.stats['frames_failed']}, "
                   f"FPS: {fps:.2f}, "
                   f"Runtime: {runtime:.1f}s")
    
    def _process_frame_callback(self, ch, method, properties, body):
        """Process frame with user-configured pipeline parameters."""
        start_time = time.time()
        
        try:
            # Parse message
            message = json.loads(body)
            camera_name = message['camera_name']
            frame_timestamp = message.get('timestamp', time.time())
            
            # Decode frame
            frame_bytes = bytes.fromhex(message['frame'])
            frame = cv2.imdecode(np.frombuffer(frame_bytes, np.uint8), cv2.IMREAD_COLOR)
            
            if frame is None:
                logger.error(f"Failed to decode frame from camera '{camera_name}'")
                self.stats['frames_failed'] += 1
                return
            
            # Add frame metadata (infrastructure info only)
            frame_metadata = {
                'camera_name': camera_name,
                'timestamp': frame_timestamp,
                'processing_start': start_time,
                'frame_shape': frame.shape
            }
            
            # Execute pipeline with user-configured parameters from frontend
            # All processing params (confidence, classes, etc.) come from pipeline config
            result = self.executor.execute(frame, camera_name, frame_metadata)
            
            # Update statistics
            self.stats['frames_processed'] += 1
            self.stats['last_frame_time'] = time.time()
            
            # Log performance every N frames (configured in infrastructure)
            if self.stats['frames_processed'] % PERFORMANCE_LOG_INTERVAL == 0:
                self._log_performance_stats()
                
        except json.JSONDecodeError as e:
            logger.error(f"Failed to decode JSON message: {e}")
            self.stats['frames_failed'] += 1
        except Exception as e:
            logger.error(f"Unexpected error processing frame: {e}", exc_info=True)
            self.stats['frames_failed'] += 1
        finally:
            # Always acknowledge the message
            ch.basic_ack(delivery_tag=method.delivery_tag)
            
            # Check if processing exceeds infrastructure limits
            processing_time = time.time() - start_time
            if processing_time > MAX_PROCESSING_TIME:
                logger.warning(f"Frame processing took {processing_time:.2f}s for camera {camera_name} "
                             f"(exceeds limit of {MAX_PROCESSING_TIME}s)")
    
    def run(self):
        """Main service loop with automatic reconnection."""
        logger.info("Starting Frame Processing Service")
        logger.info(f"Connected to API Gateway: {API_GATEWAY_URL}")
        logger.info(f"Models path: {MODELS_PATH}")
        logger.info(f"GPU enabled: {USE_GPU}")
        
        while True:
            connection = None
            try:
                logger.info("Connecting to RabbitMQ...")
                connection = pika.BlockingConnection(self.connection_params)
                channel = connection.channel()
                
                # Declare queue with durability
                channel.queue_declare(queue='frames_queue', durable=True)
                channel.basic_qos(prefetch_count=1)
                
                # Set up consumer
                channel.basic_consume(
                    queue='frames_queue', 
                    on_message_callback=self._process_frame_callback
                )
                
                logger.info("Ready to process frames with user-configured pipelines. Press CTRL+C to exit")
                channel.start_consuming()
                
            except pika.exceptions.AMQPConnectionError as e:
                logger.warning(f"RabbitMQ connection lost: {e}. Reconnecting in 5 seconds...")
                time.sleep(5)
            except KeyboardInterrupt:
                logger.info("Shutdown requested. Stopping service...")
                break
            except Exception as e:
                logger.error(f"Unexpected error in main loop: {e}", exc_info=True)
                time.sleep(5)
            finally:
                if connection and connection.is_open:
                    connection.close()
        
        # Final performance report
        self._log_performance_stats()
        logger.info("Frame Processing Service stopped")


def main():
    """Entry point for the frame processing service."""
    try:
        logger.info("Infrastructure configuration loaded from environment variables")
        
        # Note: Processing parameters (confidence thresholds, classes, etc.) 
        # are configured by users via frontend and stored in pipeline configs
        
        service = FrameProcessingService()
        service.run()
    except Exception as e:
        logger.error(f"Failed to start service: {e}", exc_info=True)
        return 1
    return 0


if __name__ == '__main__':
    exit(main())