import cv2
import pika
import os
import json
import time
import logging
import threading
import requests

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

RABBITMQ_HOST = os.getenv('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.getenv('RABBITMQ_USER', 'guest')
RABBITMQ_PASS = os.getenv('RABBITMQ_PASS', 'guest')
API_GATEWAY_URL = os.getenv('API_GATEWAY_URL')

if not API_GATEWAY_URL:
    raise ValueError("API_GATEWAY_URL environment variable not set.")

running_cameras = {}

def get_rabbitmq_connection():
    max_retries = 10
    retry_delay = 5
    for i in range(max_retries):
        try:
            credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
            connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST, credentials=credentials, heartbeat=600))
            return connection
        except pika.exceptions.AMQPConnectionError as e:
            logging.warning(f"RabbitMQ connection failed (attempt {i+1}/{max_retries}): {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
    raise Exception("Could not connect to RabbitMQ.")

def publish_frame(channel, frame, camera_name):
    _, buffer = cv2.imencode('.jpg', frame)
    message = {
        'camera_name': camera_name,
        'timestamp': time.time(),
        'frame': buffer.tobytes().hex()
    }
    try:
        channel.basic_publish(
            exchange='',
            routing_key='frames_queue',
            body=json.dumps(message),
            properties=pika.BasicProperties(delivery_mode=1)
        )
    except Exception as e:
        logging.error(f"Failed to publish frame from {camera_name}: {e}")

def capture_camera(config, stop_event):
    camera_name = config['name']
    url = config['rtsp_url']
    
    try:
        url_int = int(url)
        url = url_int
    except ValueError:
        pass
        
    connection = get_rabbitmq_connection()
    channel = connection.channel()
    channel.queue_declare(queue='frames_queue', durable=False)

    logging.info(f"Starting capture for camera: {camera_name} at {url}")
    cap = cv2.VideoCapture(url)
    
    if not cap.isOpened():
        logging.error(f"Error opening video stream for {camera_name}")
        connection.close()
        return

    while not stop_event.is_set():
        ret, frame = cap.read()
        if not ret:
            logging.warning(f"Failed to grab frame from {camera_name}. Reconnecting in 5s...")
            cap.release()
            time.sleep(5)
            cap = cv2.VideoCapture(url)
            continue
            
        publish_frame(channel, frame, camera_name)
        time.sleep(0.1)

    cap.release()
    connection.close()
    logging.info(f"Capture stopped for camera: {camera_name}")

def sync_cameras():
    global running_cameras
    
    while True:
        try:
            logging.info("Syncing camera configurations from API...")
            response = requests.get(f"{API_GATEWAY_URL}/api/cameras", timeout=10)
            
            if response.status_code == 200:
                try:
                    camera_list = response.json()
                    if not isinstance(camera_list, list):
                        logging.error(f"API returned non-list data: {camera_list}")
                        time.sleep(30)
                        continue

                    active_cameras = {cam['name']: cam for cam in camera_list if cam.get('is_active')}
                except json.JSONDecodeError:
                    logging.error(f"Failed to decode JSON from API response. Response text: {response.text}")
                    time.sleep(30)
                    continue
            else:
                logging.error(f"API returned non-200 status code: {response.status_code}. Response: {response.text}")
                time.sleep(30)
                continue

            # Câmaras a parar
            for name in list(running_cameras.keys()):
                if name not in active_cameras:
                    logging.info(f"Stopping camera thread for: {name}")
                    running_cameras[name]['stop_event'].set()
                    running_cameras[name]['thread'].join()
                    del running_cameras[name]
            
            # Câmaras a iniciar
            for name, config in active_cameras.items():
                if name not in running_cameras:
                    logging.info(f"Starting camera thread for: {name}")
                    stop_event = threading.Event()
                    thread = threading.Thread(target=capture_camera, args=(config, stop_event))
                    running_cameras[name] = {'thread': thread, 'stop_event': stop_event}
                    thread.start()
                    
        except requests.RequestException as e:
            logging.error(f"Could not sync cameras from API: {e}")
        
        time.sleep(30)

def main():
    sync_cameras()

if __name__ == '__main__':
    main()