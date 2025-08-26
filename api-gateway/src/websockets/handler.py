import asyncio
import logging
import os
from typing import List
from fastapi import WebSocket, WebSocketDisconnect, APIRouter, Depends, Query
from .. import auth, models
from ..database import get_db
from sqlalchemy.orm import Session
import aio_pika

# --- Configuração ---
RABBITMQ_URL = os.getenv('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq/')
WEBSOCKET_QUEUE_NAME = 'websocket_events'
CONFIG_EXCHANGE_NAME = 'config_events'

logger = logging.getLogger(__name__)

# --- Classe Única de Gerenciamento ---

class RabbitMQManager:
    """
    Gerencia a conexão com o RabbitMQ, a comunicação com WebSockets
    e a publicação de eventos de configuração.
    """
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection: aio_pika.Connection = None
        self.channel: aio_pika.Channel = None

    async def connect_to_rabbitmq(self, loop):
        # ... (seu método aqui)
        while True:
            try:
                self.connection = await aio_pika.connect_robust(RABBITMQ_URL, loop=loop)
                self.channel = await self.connection.channel()
                await self.channel.declare_exchange(CONFIG_EXCHANGE_NAME, aio_pika.ExchangeType.TOPIC, durable=False)
                logger.info("Conectado ao RabbitMQ com sucesso.")
                return
            except aio_pika.exceptions.AMQPConnectionError as e:
                logger.error(f"Erro de conexão com o RabbitMQ: {e}. Tentando reconectar em 5 segundos...")
                await asyncio.sleep(5)

    async def websocket_listener(self):
        # ... (seu método aqui)
        if not self.channel:
            logger.error("O canal do RabbitMQ não está disponível para o listener do WebSocket.")
            return

        queue = await self.channel.declare_queue(WEBSOCKET_QUEUE_NAME, durable=False)
        logger.info("Ouvindo a fila de eventos do WebSocket.")
        async with self.connection:
            async for message in queue:
                async with message.process():
                    body = message.body.decode()
                    await self.broadcast(body)

    async def connect_websocket(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"Nova conexão WebSocket. Total: {len(self.active_connections)}")

    def disconnect_websocket(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket desconectado. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        # ... (seu método aqui)
        living_connections = []
        while len(self.active_connections) > 0:
            connection = self.active_connections.pop(0)
            try:
                await connection.send_text(message)
                living_connections.append(connection)
            except Exception:
                # A desconexão será tratada pelo FastAPI
                pass
        self.active_connections = living_connections
    
    async def publish_config_update(self, camera_name: str):
        # ... (seu método aqui)
        if not self.channel:
            logger.error("Não é possível publicar a atualização de configuração: canal do RabbitMQ indisponível.")
            return
            
        try:
            routing_key = 'pipeline.updated'
            message = camera_name.encode('utf-8')
            
            await self.channel.default_exchange.publish(
                aio_pika.Message(body=message),
                routing_key=routing_key
            )
            logger.info(f"Notificação de atualização enviada para a câmera '{camera_name}'")
        except Exception as e:
            logger.error(f"Falha ao publicar mensagem de atualização de configuração: {e}")


# --- Instância Global e Injeção de Dependência ---
rabbit_manager = RabbitMQManager()

async def get_rabbit_manager() -> RabbitMQManager:
    # ... (sua função aqui)
    if not rabbit_manager.channel:
        await rabbit_manager.connect_to_rabbitmq(asyncio.get_event_loop())
    return rabbit_manager

# --- Router ---
router = APIRouter()

@router.on_event("startup")
async def startup_event():
    # ... (sua função aqui)
    loop = asyncio.get_event_loop()
    await rabbit_manager.connect_to_rabbitmq(loop)
    asyncio.create_task(rabbit_manager.websocket_listener())

@router.websocket("/ws/events")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    db: Session = Depends(get_db)
):
    """
    Endpoint de WebSocket que requer autenticação via token.
    1. Valida o token do usuário.
    2. Adiciona a conexão à lista de conexões ativas.
    3. Mantém a conexão aberta para receber broadcasts.
    4. Remove a conexão da lista quando o cliente se desconecta.
    """
    # 1. Autenticar o usuário
    try:
        user = await auth.get_current_user(token, db)
        if not user:
            # Se o token for inválido ou o usuário não existir, fecha a conexão
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        # Se ocorrer qualquer erro na validação do token
        logger.warning(f"Falha na autenticação do WebSocket: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # 2. Conectar e manter a conexão
    await rabbit_manager.connect_websocket(websocket)
    try:
        # Loop infinito para manter a conexão viva.
        # `receive_text()` aguarda mensagens do cliente, mas o principal
        # objetivo aqui é detectar quando o cliente fecha a conexão.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        # Bloco executado quando o cliente se desconecta.
        rabbit_manager.disconnect_websocket(websocket)
    except Exception as e:
        # Tratamento para outras exceções inesperadas
        logger.error(f"Erro inesperado na conexão WebSocket: {e}")
        rabbit_manager.disconnect_websocket(websocket)
