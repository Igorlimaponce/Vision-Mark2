import logging
import numpy as np
from .base_node import BaseNode

class ObjectDetectionNode(BaseNode):
    """
    Enhanced Object detection node with trajectory analysis capabilities.
    
    User-configurable parameters (set via frontend):
    - classes: List of object classes to detect (e.g., ['person', 'car'])
    - confidence: Minimum confidence threshold (e.g., 0.5)
    - model_filename: YOLO model to use (e.g., 'yolov8n.pt')
    - enable_tracking: Enable object tracking for trajectory analysis
    - min_track_length: Minimum track length for trajectory analysis
    """
    def execute(self, frame, input_data, shared_tools):
        logging.debug(f"Node {self.node_id}: Running enhanced object detection with user settings.")
        
        # Get the model specified by user (or default)
        model_filename = self.config.get('model_filename', 'yolov8n.pt')
        detector = shared_tools['loaded_models'].get(model_filename)
        
        if not detector:
            logging.error(f"Model {model_filename} not loaded. Skipping detection.")
            return {'detections': []}
        
        # Run detection
        detections = detector.detect(frame)
        
        # Filter by user-selected classes from frontend
        selected_classes = self.config.get('classes')
        if selected_classes:
            detections = [d for d in detections if d['class_name'] in selected_classes]

        # Filter by user-configured confidence threshold from frontend
        confidence_threshold = float(self.config.get('confidence', 0.5))
        detections = [d for d in detections if d['confidence'] >= confidence_threshold]

        # NOVO: Enhanced tracking para análise de trajetória (baseado nos vídeos)
        enable_tracking = self.config.get('enable_tracking', True)
        if enable_tracking and 'tracker' in shared_tools:
            tracker = shared_tools['tracker']
            
            # Update tracker com frame para melhor Re-ID
            tracked_objects = tracker.update(detections, frame)
            
            # Adicionar informações de tracking às detecções
            for detection in detections:
                # Encontrar objeto correspondente no tracker
                detection_center = self._get_detection_center(detection['box'])
                
                for track_id, track_bbox in tracked_objects.items():
                    track_center = self._get_bbox_center(track_bbox)
                    
                    # Se detecção corresponde ao track (distância mínima)
                    if self._calculate_distance(detection_center, track_center) < 50:
                        detection['track_id'] = track_id
                        
                        # NOVO: Adicionar análise de trajetória (dos vídeos)
                        if hasattr(tracker, 'trackers'):
                            for track_obj in tracker.trackers:
                                if track_obj.id == track_id:
                                    # Informações de movimento
                                    detection['speed'] = getattr(track_obj, 'speed', 0.0)
                                    detection['direction'] = getattr(track_obj, 'direction', 0.0)
                                    detection['trajectory_length'] = len(getattr(track_obj, 'trajectory', []))
                                    
                                    # Padrão de movimento
                                    movement_pattern = getattr(track_obj, 'get_movement_pattern', lambda: None)
                                    if callable(movement_pattern):
                                        pattern = movement_pattern()
                                        if pattern:
                                            detection['movement_pattern'] = pattern.value
                                    
                                    # Análise de trajetória
                                    trajectory_analysis = getattr(track_obj, 'get_trajectory_analysis', lambda: None)
                                    if callable(trajectory_analysis):
                                        analysis = trajectory_analysis()
                                        if analysis:
                                            detection['trajectory_analysis'] = analysis
                                    break

        logging.debug(f"Node {self.node_id}: Found {len(detections)} detections with enhanced tracking.")
        return {'detections': detections}
    
    def _get_detection_center(self, bbox):
        """Calcula centro da detecção"""
        return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    
    def _get_bbox_center(self, bbox):
        """Calcula centro do bbox"""
        if len(bbox) == 4:
            return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
        return [bbox[0], bbox[1]]  # Se já for centro
    
    def _calculate_distance(self, point1, point2):
        """Calcula distância euclidiana entre dois pontos"""
        return np.sqrt((point1[0] - point2[0])**2 + (point1[1] - point2[1])**2)
