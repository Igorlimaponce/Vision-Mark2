import logging
import json
import cv2
import os
import time
from datetime import datetime
import psycopg2
from .base_node import BaseNode

class DataSinkNode(BaseNode):
    """
    Salva um evento no banco de dados se receber alguma detecção.
    """
    def __init__(self, node_info):
        super().__init__(node_info)
        # Cada nó que acessa o DB precisa de sua própria conexão
        self.db_url = os.getenv('EVENTS_DB_URL')
        self.media_path = os.getenv('MEDIA_PATH')

    def _save_media(self, frame, camera_name):
        try:
            timestamp_str = datetime.now().strftime('%Y%m%d_%H%M%S_%f')
            filename = f"{camera_name}_{timestamp_str}.jpg"
            full_path = os.path.join(self.media_path, filename)
            
            cv2.imwrite(full_path, frame)
            logging.info(f"Saved media to {full_path}")
            return f"/media/{filename}" # Caminho relativo para a API
        except Exception as e:
            logging.error(f"Could not save media: {e}")
            return None

    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        
        if detections:
            pipeline_id = shared_tools['pipeline_id']
            camera_name = shared_tools['camera_name']
            
            event_type = self.config.get('event_type', 'Generic Detection')
            message = f"{len(detections)} objeto(s) do tipo '{event_type}' detectados."
            
            media_file_path = self._save_media(frame, camera_name)
            
            sql = """
                INSERT INTO events (pipeline_id, timestamp, camera_name, event_type, message, media_path, details)
                VALUES (%s, NOW(), %s, %s, %s, %s, %s);
            """
            details_json = json.dumps({'detections': detections})

            try:
                with psycopg2.connect(self.db_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(sql, (pipeline_id, camera_name, event_type, message, media_file_path, details_json))
                
                # Publica no websocket para atualização em tempo real
                ws_payload = {
                    'pipeline_id': pipeline_id, 'camera_name': camera_name, 
                    'event_type': event_type, 'timestamp': time.time()
                }
                shared_tools['rabbit_channel'].basic_publish(
                    exchange='ws_exchange', routing_key='', body=json.dumps(ws_payload)
                )

                logging.info(f"Node {self.node_id}: Event '{event_type}' saved to database.")
            except Exception as e:
                logging.error(f"Failed to save event to database: {e}")

        return {}