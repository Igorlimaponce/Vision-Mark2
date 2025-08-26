import logging
from .base_node import BaseNode

class LoiteringDetectionNode(BaseNode):
    """
    Identifica objetos que permanecem na cena por mais tempo que o permitido.
    UPGRADE: Agora suporta DeepSORT avançado com Re-identificação
    """
    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        if not detections:
            return {'detections': []}
            
        tracker = shared_tools.get('tracker')
        if not tracker:
            logging.warning(f"Node {self.node_id}: Tracker not found in shared_tools.")
            return {'detections': []}

        time_threshold = int(self.config.get('time_threshold', 10))
        logging.debug(f"Node {self.node_id}: Checking for loitering with a {time_threshold}s threshold.")

        # NOVO: Atualiza o tracker com frame para melhor Re-identificação
        # O HybridTracker automaticamente escolhe DeepSORT ou CentroidTracker
        tracked_boxes = tracker.update(detections, frame)
        
        # NOVO: Obtém informações detalhadas de loitering (se DeepSORT disponível)
        detailed_loitering_info = tracker.get_detailed_loitering_info()
        
        # Obtém os IDs dos objetos que estão fazendo loitering
        loitering_object_ids = tracker.get_loitering_objects(time_threshold)
        
        loitering_detections = []
        
        # NOVO: Se temos informações detalhadas (DeepSORT), usar dados precisos
        if detailed_loitering_info:
            for object_id, info in detailed_loitering_info.items():
                if object_id in loitering_object_ids:
                    # Criar detecção baseada em informações do tracker
                    loitering_detection = {
                        'box': info['bbox'],
                        'class': 'person',
                        'confidence': 0.9,  # Alta confiança para loitering detectado
                        'loitering': True,
                        'loitering_duration': info['duration'],
                        'loitering_confidence': info['confidence'],
                        'tracker_hits': info['hits'],
                        'object_id': object_id,
                        'detection_type': 'advanced_loitering'
                    }
                    loitering_detections.append(loitering_detection)
        else:
            # FALLBACK: Usar método tradicional se DeepSORT não disponível
            for object_id, box in tracked_boxes.items():
                if object_id in loitering_object_ids:
                    # Encontra a detecção original correspondente à caixa
                    for det in detections:
                        if self._boxes_match(det['box'], box):
                            # Adiciona uma anotação de loitering à detecção
                            det_copy = det.copy()
                            det_copy['loitering'] = True
                            det_copy['object_id'] = object_id
                            det_copy['detection_type'] = 'basic_loitering'
                            loitering_detections.append(det_copy)
                            break

        if loitering_detections:
            # NOVO: Log com mais detalhes
            tracker_type = getattr(tracker, 'current_tracker_type', 'unknown')
            logging.info(f"Node {self.node_id}: Detected {len(loitering_detections)} loitering objects using {tracker_type} tracker.")
            
            # NOVO: Log estatísticas do tracker se disponível
            if hasattr(tracker, 'get_tracker_stats'):
                stats = tracker.get_tracker_stats()
                logging.debug(f"Tracker stats: {stats}")

        # O resultado são as detecções que satisfazem o critério de loitering
        return {'detections': loitering_detections}
    
    def _boxes_match(self, box1, box2, tolerance=10):
        """
        Verifica se duas bounding boxes são similares (dentro de uma tolerância)
        """
        if isinstance(box2, (list, tuple)) and len(box2) == 4:
            box2_list = list(box2)
        else:
            # Se box2 é um numpy array ou outro formato
            box2_list = list(box2) if hasattr(box2, '__iter__') else [0, 0, 0, 0]
        
        # Calcular diferença média entre coordenadas
        diff = sum(abs(a - b) for a, b in zip(box1, box2_list)) / 4
        return diff <= tolerance