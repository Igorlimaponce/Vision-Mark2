import logging
from .base_node import BaseNode

class WhatsAppNode(BaseNode):
    """
    (Placeholder) Envia uma notificação por WhatsApp.
    A lógica de envio via alguma API de WhatsApp será implementada aqui.
    """
    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        detections = input_data.get('detections', [])
        
        if detections:
            logging.info(f"Node {self.node_id} (WhatsApp): Lógica de envio de WhatsApp a ser implementada.")
            # Exemplo de como você acessaria a configuração:
            # api_key = self.config.get('api_key')
            # to_number = self.config.get('to_number')
            # message = self.config.get('message')
            # ... lógica de envio ...
        
        return {}