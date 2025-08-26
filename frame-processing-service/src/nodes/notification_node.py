import logging
import json
from .base_node import BaseNode

class NotificationNode(BaseNode):
    """
    Envia uma notificação se receber alguma detecção do nó anterior.
    """
    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        
        # Só envia notificação se houver detecções na entrada
        if detections:
            rabbit_channel = shared_tools['rabbit_channel']
            camera_name = shared_tools.get('camera_name', 'N/A')
            pipeline_name = shared_tools.get('pipeline_name', 'N/A')
            
            message_template = self.config.get('message', 'Alerta: {count} objeto(s) detectado(s) na câmera {camera}.')
            
            # Formata a mensagem
            message = message_template.format(count=len(detections), camera=camera_name)
            
            notification_payload = {
                'subject': f"Alerta do Pipeline: {pipeline_name}",
                'body': message,
            }
            
            try:
                rabbit_channel.basic_publish(
                    exchange='',
                    routing_key='notifications_queue',
                    body=json.dumps(notification_payload),
                    properties=pika.BasicProperties(delivery_mode=2) # Mensagem persistente
                )
                logging.info(f"Node {self.node_id}: Notification sent for pipeline '{pipeline_name}'.")
            except Exception as e:
                logging.error(f"Failed to send notification: {e}")
        
        # Este nó não modifica os dados, apenas age, então retorna um dicionário vazio.
        return {}