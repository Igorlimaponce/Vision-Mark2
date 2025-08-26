import logging
from .base_node import BaseNode

class EmailNode(BaseNode):
    """
    (Placeholder) Envia uma notificação por E-mail.
    A lógica de envio de e-mail será implementada aqui no futuro.
    """
    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        detections = input_data.get('detections', [])
        
        if detections:
            logging.info(f"Node {self.node_id} (Email): Lógica de envio de e-mail a ser implementada.")
            # Exemplo de como você acessaria a configuração:
            # smtp_server = self.config.get('smtp_server')
            # recipient = self.config.get('recipient')
            # subject = self.config.get('subject')
            # message = self.config.get('message')
            # ... lógica de envio ...
        
        return {}