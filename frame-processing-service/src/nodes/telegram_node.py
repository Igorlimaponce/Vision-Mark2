import logging
import requests
from .base_node import BaseNode

class TelegramNode(BaseNode):
    """
    Envia uma notificação para o Telegram se receber alguma detecção do nó anterior.
    A configuração (token, chat_id) é feita diretamente no nó, na UI.
    """
    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        detections = input_data.get('detections', [])
        
        # Só envia notificação se houver detecções na entrada
        if not detections:
            return {}

        # Pega a configuração diretamente do nó no pipeline
        bot_token = self.config.get('bot_token')
        chat_id = self.config.get('chat_id')
        message_template = self.config.get('message', 'Alerta: {count} objeto(s) detectado(s) na câmera {camera}.')

        if not bot_token or not chat_id:
            logging.warning(f"Node {self.node_id} (Telegram): Bot Token ou Chat ID não configurado. Pulando notificação.")
            return {}

        camera_name = shared_tools.get('camera_name', 'N/A')
        
        # Formata a mensagem
        message_text = message_template.format(count=len(detections), camera=camera_name)
        
        api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        
        payload = {
            'chat_id': chat_id,
            'text': message_text,
            'parse_mode': 'Markdown'
        }
        
        try:
            response = requests.post(api_url, json=payload, timeout=10)
            response.raise_for_status()
            logging.info(f"Node {self.node_id}: Notificação do Telegram enviada com sucesso para o chat {chat_id}.")
        except requests.exceptions.RequestException as e:
            logging.error(f"Node {self.node_id}: Falha ao enviar notificação para o Telegram: {e}")
        
        # Este nó não modifica os dados, apenas age, então retorna um dicionário vazio.
        return {}