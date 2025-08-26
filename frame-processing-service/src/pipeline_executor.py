import logging
import os
import requests
import pika
import threading
from collections import deque
from detectors.detectors import ObjectDetector
# UPGRADE: Importa novo sistema híbrido de tracking
from trackers.hybrid_tracker import HybridTracker, TrackerFactory

# Import all node types
from nodes.base_node import BaseNode
from nodes.detection_node import ObjectDetectionNode
from nodes.polygon_filter_node import PolygonFilterNode
from nodes.direction_filter_node import DirectionFilterNode
from nodes.data_sink_node import DataSinkNode
from nodes.loitering_detection_node import LoiteringDetectionNode
from nodes.trajectory_analysis_node import TrajectoryAnalysisNode  # NOVO
from nodes.telegram_node import TelegramNode
from nodes.email_node import EmailNode
from nodes.whatsapp_node import WhatsAppNode
from nodes.face_detector_node import FaceDetectorNode
from nodes.face_embedding_node import FaceEmbeddingNode
from nodes.face_matcher_node import FaceMatcherNode

# Configuration from environment variables
API_GATEWAY_URL = os.getenv("API_GATEWAY_URL", "http://api-gateway:8000")
PIPELINE_CACHE_TTL = int(os.getenv("PIPELINE_CACHE_TTL", "300"))  # seconds

class PipelineExecutor:
    """
    Executes computer vision pipelines with user-configured parameters.

    Responsibilities:
    - Fetches pipeline configurations from API (contains user settings from frontend)
    - Maintains cache of pipeline configs for performance
    - Listens for pipeline updates via RabbitMQ
    - Executes pipeline nodes with user-specified parameters (confidence, classes, etc.)
    """
    def __init__(self, rabbit_connection_params):
        self.rabbit_connection_params = rabbit_connection_params
        self.loaded_models = {}
        self.trackers = {}
        self.pipeline_cache = {} # Cache para armazenar pipelines: { "camera_name": pipeline_config }
        
        self.node_map = {
            'objectDetection': ObjectDetectionNode,
            'polygonFilter': PolygonFilterNode,
            'directionFilter': DirectionFilterNode,
            'loiteringDetection': LoiteringDetectionNode,
            'trajectoryAnalysis': TrajectoryAnalysisNode,  # NOVO
            'dataSink': DataSinkNode,
            'telegram': TelegramNode,
            'email': EmailNode,
            'whatsapp': WhatsAppNode,
            'faceDetector': FaceDetectorNode,
            'faceEmbedding': FaceEmbeddingNode,
            'faceMatcher': FaceMatcherNode,
        }
        
        # Inicia o "ouvinte" de atualizações de configuração em uma thread separada
        self._start_config_update_listener()

    def _start_config_update_listener(self):
        """ Inicia um consumidor RabbitMQ em uma thread para invalidar o cache. """
        
        def listener_thread():
            logging.info("Ouvinte de atualização de configuração iniciado.")
            connection = pika.BlockingConnection(self.rabbit_connection_params)
            channel = connection.channel()

            channel.exchange_declare(exchange='config_events', exchange_type='topic')
            
            # Cria uma fila exclusiva que será deletada quando a conexão for fechada
            result = channel.queue_declare(queue='', exclusive=True)
            queue_name = result.method.queue

            # Assina o tópico de atualização de pipelines
            channel.queue_bind(exchange='config_events', queue=queue_name, routing_key='pipeline.updated')

            def callback(ch, method, properties, body):
                try:
                    # Mensagem esperada no formato: "camera-1"
                    camera_name = body.decode()
                    if camera_name in self.pipeline_cache:
                        logging.info(f"Evento de atualização recebido. Invalidando cache para a câmera: '{camera_name}'")
                        del self.pipeline_cache[camera_name]
                except Exception as e:
                    logging.error(f"Erro ao processar mensagem de invalidação de cache: {e}")

            channel.basic_consume(queue=queue_name, on_message_callback=callback, auto_ack=True)
            channel.start_consuming()

        # daemon=True garante que a thread não impedirá o programa de sair
        thread = threading.Thread(target=listener_thread, daemon=True)
        thread.start()

    def _get_pipeline_for_camera(self, camera_name: str):
        """
        Busca o pipeline para uma câmera específica, priorizando o cache local.
        Se não encontrar no cache, busca via API.
        """
        if camera_name in self.pipeline_cache:
            logging.debug(f"Cache HIT para pipeline da câmera: {camera_name}")
            return self.pipeline_cache[camera_name]
        
        logging.info(f"Cache MISS. Buscando pipeline para a câmera '{camera_name}' na API.")
        try:
            # Assume que a API pode retornar uma lista de pipelines ativos para uma câmera.
            # Estamos interessados apenas no primeiro.
            response = requests.get(f"{API_GATEWAY_URL}/api/pipelines?camera_name={camera_name}")
            response.raise_for_status()
            
            pipelines = response.json()
            if pipelines:
                pipeline = pipelines[0] # Usa o primeiro pipeline encontrado
                self.pipeline_cache[camera_name] = pipeline # Armazena no cache
                return pipeline
            else:
                logging.warning(f"Nenhum pipeline ativo encontrado para a câmera '{camera_name}'.")
                self.pipeline_cache[camera_name] = None # Cache nulo para evitar buscas repetidas
                return None
        except requests.RequestException as e:
            logging.error(f"Não foi possível buscar pipeline da API para a câmera '{camera_name}': {e}")
            self.pipeline_cache[camera_name] = None # Cache nulo em caso de erro de conexão
            return None

    def _topological_sort(self, nodes, edges):
        # Esta função permanece a mesma
        in_degree = {node['id']: 0 for node in nodes}
        adj = {node['id']: [] for node in nodes}
        for edge in edges:
            adj.setdefault(edge['source'], []).append(edge['target'])
            in_degree[edge['target']] += 1
        
        queue = deque([node['id'] for node in nodes if in_degree[node['id']] == 0])
        sorted_order = []
        nodes_dict = {node['id']: node for node in nodes}

        while queue:
            u = queue.popleft()
            if nodes_dict[u]['type'] != 'videoInput':
                sorted_order.append(u)
            for v in adj.get(u, []):
                in_degree[v] -= 1
                if in_degree[v] == 0:
                    queue.append(v)
        return sorted_order

    def _preload_models_for_pipeline(self, nodes_config):
        # Esta função permanece a mesma
        for node in nodes_config:
            if node['type'] == 'objectDetection':
                model_filename = node['data'].get('model_filename', 'yolov8n.pt')
                if model_filename not in self.loaded_models:
                    logging.info(f"Carregando modelo '{model_filename}'...")
                    try:
                        self.loaded_models[model_filename] = ObjectDetector(model_filename)
                    except Exception as e:
                        logging.error(f"Erro ao carregar modelo '{model_filename}': {e}")
                        self.loaded_models[model_filename] = None

    def execute(self, frame, camera_name: str, frame_metadata=None):
        """
        Execute pipeline with user-configured parameters from frontend.
        
        Args:
            frame: Input video frame
            camera_name: Name of the camera
            frame_metadata: Optional metadata about the frame (timestamp, etc.)
        
        Note: All processing parameters (confidence thresholds, classes to detect,
        polygon coordinates, etc.) come from the pipeline configuration that was
        set by the user via the frontend interface, NOT from hardcoded config files.
        """
        # 1. Get pipeline configuration (contains user settings from frontend)
        pipeline = self._get_pipeline_for_camera(camera_name)

        # 2. If no pipeline configured for this camera, nothing to do
        if not pipeline:
            return

        pipeline_id = pipeline['id']
        graph = pipeline['graph_data']
        
        # 3. Preload models as needed
        self._preload_models_for_pipeline(graph['nodes'])
        
        # 4. Setup execution context with shared tools and user's camera settings
        # UPGRADE: Usando HybridTracker que automaticamente escolhe DeepSORT ou CentroidTracker
        if pipeline_id not in self.trackers:
            logging.info(f"Inicializando HybridTracker para pipeline {pipeline_id}")
            self.trackers[pipeline_id] = HybridTracker(
                use_advanced=True,  # Tenta DeepSORT primeiro
                fallback_on_error=True,  # Fallback para CentroidTracker se necessário
                max_disappeared=30,
                loitering_threshold=15
            )
        
        data_context = {
            'results': {},
            'shared_tools': {
                'loaded_models': self.loaded_models,
                'tracker': self.trackers[pipeline_id],
                'camera_name': camera_name,
                'frame_metadata': frame_metadata or {},
            }
        }
        
        # 5. Execute nodes in topological order with user-configured parameters
        execution_order = self._topological_sort(graph['nodes'], graph['edges'])

        for node_id in execution_order:
            node_info = next((n for n in graph['nodes'] if n['id'] == node_id), None)
            if not node_info or node_info['type'] not in self.node_map:
                continue

            # Gather inputs from previous nodes
            input_data = {}
            for edge in graph['edges']:
                if edge['target'] == node_id and edge['source'] in data_context['results']:
                    input_data.update(data_context['results'][edge['source']])

            # Execute node with user's configuration from frontend
            # (node_info['data'] contains the user's settings like confidence, classes, etc.)
            node_instance = self.node_map[node_info['type']](node_info)
            node_result = node_instance.execute(frame, input_data, data_context['shared_tools'])
            data_context['results'][node_id] = node_result

        return data_context['results']