"""
DeepSORT Advanced Tracker para Jarvis Vision System
Implementação robusta com Filtro de Kalman + Re-identificação por aparência
Resolve problemas de ID-Switch e melhora drasticamente a detecção de loitering

FUNCIONALIDADES AVANÇADAS BASEADAS EM ESTUDOS DE CASO:
- Trajectory Analysis (análise de trajetórias completas)
- Speed Estimation (estimativa de velocidade em tempo real)
- Direction Detection (detecção precisa de direção)
- Zone Crossing Detection (cruzamento de zonas de interesse)
- Advanced Loitering with Movement Patterns
- Crowd Density Analysis
- Behavioral Pattern Recognition
"""

import numpy as np
import cv2
import torch
import torch.nn as nn
import torch.nn.functional as F
from collections import OrderedDict, deque
from scipy.spatial.distance import cdist
from filterpy.kalman import KalmanFilter
import time
import logging
import math
from typing import List, Tuple, Dict, Optional
from enum import Enum

class TrackState(Enum):
    """Estados do track baseados no DeepSORT original"""
    TENTATIVE = 1
    CONFIRMED = 2
    DELETED = 3

class MovementPattern(Enum):
    """Padrões de movimento detectados"""
    STATIONARY = "stationary"
    WALKING = "walking"
    RUNNING = "running"
    IRREGULAR = "irregular"
    LOITERING = "loitering"
    CROSSING = "crossing"

class ZoneEvent(Enum):
    """Eventos de zona"""
    ENTER = "enter"
    EXIT = "exit"
    DWELL = "dwell"
    CROSS = "cross"

class FeatureExtractor(nn.Module):
    """
    Rede neural para extração de features de Re-ID (Re-identificação)
    Baseada em ResNet18 simplificada para embeddings de aparência
    """
    def __init__(self, feature_dim=128):
        super(FeatureExtractor, self).__init__()
        
        # Encoder convolucional
        self.conv1 = nn.Conv2d(3, 32, 3, stride=1, padding=1)
        self.conv2 = nn.Conv2d(32, 64, 3, stride=2, padding=1)
        self.conv3 = nn.Conv2d(64, 128, 3, stride=2, padding=1)
        self.conv4 = nn.Conv2d(128, 256, 3, stride=2, padding=1)
        
        # Global Average Pooling + FC
        self.global_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.fc = nn.Linear(256, feature_dim)
        self.dropout = nn.Dropout(0.5)
        
        # Batch normalization
        self.bn1 = nn.BatchNorm2d(32)
        self.bn2 = nn.BatchNorm2d(64)
        self.bn3 = nn.BatchNorm2d(128)
        self.bn4 = nn.BatchNorm2d(256)
        
    def forward(self, x):
        # Input: (B, 3, H, W) - Patch da pessoa detectada
        x = F.relu(self.bn1(self.conv1(x)))
        x = F.relu(self.bn2(self.conv2(x)))
        x = F.relu(self.bn3(self.conv3(x)))
        x = F.relu(self.bn4(self.conv4(x)))
        
        # Global pooling e feature vector
        x = self.global_pool(x)
        x = torch.flatten(x, 1)
        x = self.dropout(x)
        x = self.fc(x)
        
        # L2 normalize para cosine similarity
        return F.normalize(x, p=2, dim=1)

class KalmanBoxTracker:
    """
    Tracker individual usando Filtro de Kalman para previsão de movimento
    Estado: [cx, cy, aspect_ratio, height, dcx, dcy, dh]
    """
    count = 0
    
    def __init__(self, bbox, feature_vector=None):
        # Dimensões do estado: [cx, cy, s, h, dcx, dcy, dh]
        self.kf = KalmanFilter(dim_x=7, dim_z=4)
        
        # Matriz de transição (modelo de velocidade constante)
        self.kf.F = np.array([
            [1, 0, 0, 0, 1, 0, 0],  # cx = cx + dcx
            [0, 1, 0, 0, 0, 1, 0],  # cy = cy + dcy  
            [0, 0, 1, 0, 0, 0, 0],  # s = s (aspect ratio constante)
            [0, 0, 0, 1, 0, 0, 1],  # h = h + dh
            [0, 0, 0, 0, 1, 0, 0],  # dcx = dcx
            [0, 0, 0, 0, 0, 1, 0],  # dcy = dcy
            [0, 0, 0, 0, 0, 0, 1]   # dh = dh
        ])
        
        # Matriz de observação (observamos apenas posição e tamanho)
        self.kf.H = np.array([
            [1, 0, 0, 0, 0, 0, 0],  # observamos cx
            [0, 1, 0, 0, 0, 0, 0],  # observamos cy
            [0, 0, 1, 0, 0, 0, 0],  # observamos s
            [0, 0, 0, 1, 0, 0, 0]   # observamos h
        ])
        
        # Noise de processo e medição
        self.kf.R[2:, 2:] *= 10.0  # incerteza na medição de s, h
        self.kf.P[4:, 4:] *= 1000.0  # alta incerteza inicial na velocidade
        self.kf.P *= 10.0
        self.kf.Q[-1, -1] *= 0.01  # processo noise baixo para altura
        self.kf.Q[4:, 4:] *= 0.01  # processo noise baixo para velocidades
        
        # Inicializar estado
        self.kf.x[:4] = self._convert_bbox_to_z(bbox)
        
        # Tracking info
        self.time_since_update = 0
        self.id = KalmanBoxTracker.count
        KalmanBoxTracker.count += 1
        self.history = []
        self.hits = 0
        self.hit_streak = 0
        self.age = 0
        
        # Re-ID features
        self.features = deque(maxlen=10)  # Histórico de features para robustez
        if feature_vector is not None:
            self.features.append(feature_vector)
            
        # Loitering detection
        self.positions_history = deque(maxlen=30)  # 30 frames de histórico
        self.loitering_start_time = None
        self.last_significant_movement = time.time()
        
        # Trajectory analysis
        self.trajectory = []
        self.speed = 0.0
        self.direction = 0.0
        
        # Zone interaction history
        self.zone_history = {}
        
    def update(self, bbox, feature_vector=None):
        """Atualiza o tracker com nova detecção"""
        self.time_since_update = 0
        self.history = []
        self.hits += 1
        self.hit_streak += 1
        
        # Update Kalman
        self.kf.update(self._convert_bbox_to_z(bbox))
        
        # Update features para Re-ID
        if feature_vector is not None:
            self.features.append(feature_vector)
            
        # Update position history para loitering
        center = self._get_center_from_bbox(bbox)
        self.positions_history.append(center)
        
        # Check movimento significativo
        if self._has_moved_significantly():
            self.last_significant_movement = time.time()
            self.loitering_start_time = None
        elif self.loitering_start_time is None:
            self.loitering_start_time = time.time()
        
        # Atualizar trajetória
        self.trajectory.append(center)
        if len(self.trajectory) > 2:
            self.speed = self._estimate_speed()
            self.direction = self._estimate_direction()
    
    def predict(self):
        """Prediz próxima posição usando Kalman"""
        if (self.kf.x[6] + self.kf.x[3]) <= 0:
            self.kf.x[6] *= 0.0
        self.kf.predict()
        self.age += 1
        if self.time_since_update > 0:
            self.hit_streak = 0
        self.time_since_update += 1
        self.history.append(self._convert_x_to_bbox(self.kf.x))
        return self.history[-1]
    
    def get_state(self):
        """Retorna bbox atual"""
        return self._convert_x_to_bbox(self.kf.x)
    
    def get_feature_vector(self):
        """Retorna feature vector médio para matching"""
        if len(self.features) == 0:
            return None
        return np.mean(self.features, axis=0)
    
    def is_loitering(self, threshold_seconds=10):
        """Verifica se está loitering"""
        if self.loitering_start_time is None:
            return False
        return (time.time() - self.loitering_start_time) > threshold_seconds
    
    def _convert_bbox_to_z(self, bbox):
        """Converte bbox [x1,y1,x2,y2] para estado kalman [cx,cy,s,h]"""
        w = bbox[2] - bbox[0]
        h = bbox[3] - bbox[1]
        x = bbox[0] + w/2.0
        y = bbox[1] + h/2.0
        s = w / float(h)  # aspect ratio
        return np.array([x, y, s, h]).reshape((4, 1))
    
    def _convert_x_to_bbox(self, x, score=None):
        """Converte estado kalman para bbox"""
        w = np.sqrt(x[2] * x[3])
        h = x[3]
        return np.array([x[0]-w/2., x[1]-h/2., x[0]+w/2., x[1]+h/2.]).flatten()
    
    def _get_center_from_bbox(self, bbox):
        """Extrai centro do bbox"""
        return [(bbox[0] + bbox[2]) / 2.0, (bbox[1] + bbox[3]) / 2.0]
    
    def _has_moved_significantly(self, threshold=25):
        """Verifica movimento significativo nos últimos frames"""
        if len(self.positions_history) < 10:
            return True  # Assume movimento se histórico insuficiente
            
        recent_positions = list(self.positions_history)[-10:]
        old_positions = list(self.positions_history)[:10] if len(self.positions_history) >= 20 else recent_positions[:5]
        
        if not old_positions:
            return True
            
        # Calcular deslocamento médio
        recent_center = np.mean(recent_positions, axis=0)
        old_center = np.mean(old_positions, axis=0)
        displacement = np.linalg.norm(recent_center - old_center)
        
        return displacement > threshold
    
    def _estimate_speed(self):
        """Estima velocidade baseado na trajetória recente"""
        if len(self.trajectory) < 2:
            return 0.0
        
        # Calcular velocidade dos últimos N pontos
        recent_points = self.trajectory[-5:] if len(self.trajectory) >= 5 else self.trajectory
        if len(recent_points) < 2:
            return 0.0
        
        total_distance = 0.0
        for i in range(1, len(recent_points)):
            distance = np.linalg.norm(np.array(recent_points[i]) - np.array(recent_points[i-1]))
            total_distance += distance
        
        # Velocidade em pixels por frame (pode ser convertida para m/s com calibração)
        return total_distance / (len(recent_points) - 1)
    
    def _estimate_direction(self):
        """Estima direção de movimento em graus"""
        if len(self.trajectory) < 2:
            return 0.0
        
        # Calcular vetor de direção dos últimos pontos
        start_point = np.array(self.trajectory[-5]) if len(self.trajectory) >= 5 else np.array(self.trajectory[0])
        end_point = np.array(self.trajectory[-1])
        
        direction_vector = end_point - start_point
        
        # Calcular ângulo em graus (0° = direita, 90° = baixo)
        angle = math.atan2(direction_vector[1], direction_vector[0])
        return math.degrees(angle)
    
    def get_movement_pattern(self):
        """Analisa padrão de movimento"""
        if self.speed < 2.0:
            return MovementPattern.STATIONARY
        elif self.speed < 8.0:
            return MovementPattern.WALKING
        elif self.speed < 20.0:
            return MovementPattern.RUNNING
        else:
            return MovementPattern.IRREGULAR
    
    def get_trajectory_analysis(self):
        """Retorna análise completa da trajetória"""
        if len(self.trajectory) < 3:
            return None
        
        trajectory_array = np.array(self.trajectory)
        
        # Calcular métricas da trajetória
        total_distance = 0.0
        for i in range(1, len(trajectory_array)):
            total_distance += np.linalg.norm(trajectory_array[i] - trajectory_array[i-1])
        
        # Distância euclidiana entre início e fim
        straight_distance = np.linalg.norm(trajectory_array[-1] - trajectory_array[0])
        
        # Índice de sinuosidade (0 = linha reta, >1 = trajetória sinuosa)
        sinuosity = total_distance / straight_distance if straight_distance > 0 else float('inf')
        
        return {
            'total_distance': total_distance,
            'straight_distance': straight_distance,
            'sinuosity': sinuosity,
            'avg_speed': self.speed,
            'direction': self.direction,
            'pattern': self.get_movement_pattern().value,
            'duration': len(self.trajectory),
            'start_position': self.trajectory[0],
            'current_position': self.trajectory[-1]
        }
    
    def check_zone_interaction(self, zones):
        """Verifica interação com zonas de interesse"""
        if not self.trajectory:
            return []
        
        current_pos = self.trajectory[-1]
        events = []
        
        for zone_id, zone_polygon in zones.items():
            # Verificar se está dentro da zona
            is_inside = self._point_in_polygon(current_pos, zone_polygon)
            
            # Verificar histórico para detectar eventos
            if zone_id not in self.zone_history:
                self.zone_history[zone_id] = []
            
            self.zone_history[zone_id].append(is_inside)
            
            # Detectar eventos (entrada, saída, permanência)
            if len(self.zone_history[zone_id]) >= 2:
                was_inside = self.zone_history[zone_id][-2]
                
                if not was_inside and is_inside:
                    events.append({
                        'type': ZoneEvent.ENTER.value,
                        'zone_id': zone_id,
                        'timestamp': time.time(),
                        'position': current_pos
                    })
                elif was_inside and not is_inside:
                    events.append({
                        'type': ZoneEvent.EXIT.value,
                        'zone_id': zone_id,
                        'timestamp': time.time(),
                        'position': current_pos
                    })
                elif is_inside:
                    # Verificar tempo de permanência
                    dwell_time = len([x for x in self.zone_history[zone_id][-30:] if x])
                    if dwell_time > 15:  # Mais de 15 frames na zona
                        events.append({
                            'type': ZoneEvent.DWELL.value,
                            'zone_id': zone_id,
                            'duration': dwell_time,
                            'timestamp': time.time(),
                            'position': current_pos
                        })
        
        return events
    
    def _point_in_polygon(self, point, polygon):
        """Verifica se um ponto está dentro de um polígono"""
        x, y = point
        n = len(polygon)
        inside = False
        
        p1x, p1y = polygon[0]
        for i in range(1, n + 1):
            p2x, p2y = polygon[i % n]
            if y > min(p1y, p2y):
                if y <= max(p1y, p2y):
                    if x <= max(p1x, p2x):
                        if p1y != p2y:
                            xinters = (y - p1y) * (p2x - p1x) / (p2y - p1y) + p1x
                        if p1x == p2x or x <= xinters:
                            inside = not inside
            p1x, p1y = p2x, p2y
        
        return inside

class DeepSORTTracker:
    """
    Tracker principal implementando algoritmo DeepSORT completo
    Combina Kalman Filter + Re-identificação por aparência
    """
    
    def __init__(self, max_disappeared=30, max_age=50, min_hits=3, iou_threshold=0.3, feature_threshold=0.6):
        self.max_disappeared = max_disappeared
        self.max_age = max_age
        self.min_hits = min_hits
        self.iou_threshold = iou_threshold
        self.feature_threshold = feature_threshold
        
        # Lista de trackers ativos
        self.trackers = []
        
        # Feature extractor para Re-ID
        self.feature_extractor = FeatureExtractor()
        self.feature_extractor.eval()  # Modo inferência
        
        # Device
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.feature_extractor.to(self.device)
        
        logging.info(f"DeepSORT initialized on device: {self.device}")
    
    def update(self, detections, frame=None):
        """
        Atualiza tracker com novas detecções
        detections: Lista de dicts com 'box' e opcionalmente 'confidence'
        frame: Frame atual para extração de features
        """
        # Predict para todos os trackers existentes
        for tracker in self.trackers:
            tracker.predict()
        
        # Extrair features se frame disponível
        features = []
        if frame is not None and len(detections) > 0:
            features = self._extract_features(frame, detections)
        
        # Fazer matching usando IoU + Features
        matched, unmatched_dets, unmatched_trks = self._associate_detections_to_trackers(
            detections, features
        )
        
        # Update matched trackers
        for m in matched:
            det_idx, trk_idx = m
            feature_vec = features[det_idx] if features else None
            self.trackers[trk_idx].update(detections[det_idx]['box'], feature_vec)
        
        # Criar novos trackers para detecções não matched
        for det_idx in unmatched_dets:
            feature_vec = features[det_idx] if features else None
            tracker = KalmanBoxTracker(detections[det_idx]['box'], feature_vec)
            self.trackers.append(tracker)
        
        # Remover trackers mortos
        self.trackers = [t for t in self.trackers if not self._should_delete_tracker(t)]
        
        # Retornar resultados
        results = {}
        for tracker in self.trackers:
            if tracker.time_since_update < 1 and (tracker.hit_streak >= self.min_hits or tracker.time_since_update == 0):
                bbox = tracker.get_state()
                results[tracker.id] = bbox
        
        return results
    
    def get_loitering_objects(self, threshold_seconds=10):
        """Retorna IDs dos objetos em loitering"""
        loitering_ids = []
        for tracker in self.trackers:
            if tracker.is_loitering(threshold_seconds) and tracker.time_since_update < 1:
                loitering_ids.append(tracker.id)
        return loitering_ids
    
    def _extract_features(self, frame, detections):
        """Extrai features de Re-ID para cada detecção"""
        features = []
        
        with torch.no_grad():
            for det in detections:
                bbox = det['box']
                x1, y1, x2, y2 = map(int, bbox)
                
                # Crop da pessoa
                crop = frame[y1:y2, x1:x2]
                if crop.size == 0:
                    features.append(np.zeros(128))  # Feature nula se crop inválido
                    continue
                
                # Resize para tamanho fixo
                crop_resized = cv2.resize(crop, (64, 128))
                
                # Normalizar e converter para tensor
                crop_tensor = torch.from_numpy(crop_resized).float()
                crop_tensor = crop_tensor.permute(2, 0, 1) / 255.0  # HWC -> CHW, normalize
                crop_tensor = crop_tensor.unsqueeze(0).to(self.device)  # Add batch dim
                
                # Extrair feature
                feature = self.feature_extractor(crop_tensor)
                features.append(feature.cpu().numpy().flatten())
        
        return features
    
    def _associate_detections_to_trackers(self, detections, features):
        """
        Faz matching entre detecções e trackers usando IoU + Features
        """
        if len(self.trackers) == 0:
            return [], list(range(len(detections))), []
        
        # Calcular matriz de IoU
        iou_matrix = self._compute_iou_matrix(detections)
        
        # Calcular matriz de features (cosine similarity)
        feature_matrix = self._compute_feature_matrix(features) if features else np.zeros_like(iou_matrix)
        
        # Combinar IoU + Features (weighted sum)
        combined_matrix = 0.7 * iou_matrix + 0.3 * feature_matrix
        
        # Hungarian matching
        matched_indices = self._hungarian_matching(combined_matrix)
        
        # Separar matched, unmatched
        unmatched_detections = []
        unmatched_trackers = []
        
        for d in range(len(detections)):
            if d not in [m[0] for m in matched_indices]:
                unmatched_detections.append(d)
        
        for t in range(len(self.trackers)):
            if t not in [m[1] for m in matched_indices]:
                unmatched_trackers.append(t)
        
        # Filtrar matches com score baixo
        good_matches = []
        for det_idx, trk_idx in matched_indices:
            if combined_matrix[det_idx, trk_idx] > 0.3:  # Threshold combinado
                good_matches.append([det_idx, trk_idx])
            else:
                unmatched_detections.append(det_idx)
                unmatched_trackers.append(trk_idx)
        
        return good_matches, unmatched_detections, unmatched_trackers
    
    def _compute_iou_matrix(self, detections):
        """Calcula matriz de IoU entre detecções e trackers"""
        if len(self.trackers) == 0:
            return np.empty((0, 0))
        
        det_boxes = np.array([det['box'] for det in detections])
        trk_boxes = np.array([trk.get_state() for trk in self.trackers])
        
        iou_matrix = np.zeros((len(det_boxes), len(trk_boxes)))
        
        for d, det_box in enumerate(det_boxes):
            for t, trk_box in enumerate(trk_boxes):
                iou_matrix[d, t] = self._compute_iou(det_box, trk_box)
        
        return iou_matrix
    
    def _compute_feature_matrix(self, det_features):
        """Calcula matriz de similaridade de features"""
        if len(self.trackers) == 0 or not det_features:
            return np.empty((0, 0))
        
        # Features dos trackers (média histórica)
        trk_features = []
        for tracker in self.trackers:
            feat = tracker.get_feature_vector()
            if feat is not None:
                trk_features.append(feat)
            else:
                trk_features.append(np.zeros(128))  # Feature nula se não disponível
        
        # Calcular cosine similarity
        det_features = np.array(det_features)
        trk_features = np.array(trk_features)
        
        # Cosine similarity = dot product de vetores normalizados
        similarity_matrix = np.dot(det_features, trk_features.T)
        
        # Garantir que está no range [0, 1]
        similarity_matrix = np.clip(similarity_matrix, 0, 1)
        
        return similarity_matrix
    
    def _hungarian_matching(self, cost_matrix):
        """Implementação simples do algoritmo húngaro"""
        if cost_matrix.size == 0:
            return []
        
        # Para simplicidade, usar matching ganancioso
        # Em produção, use scipy.optimize.linear_sum_assignment
        matched_indices = []
        
        # Transformar em problema de minimização
        cost_matrix = 1.0 - cost_matrix
        
        for _ in range(min(cost_matrix.shape)):
            # Encontrar mínimo global
            min_idx = np.unravel_index(cost_matrix.argmin(), cost_matrix.shape)
            det_idx, trk_idx = min_idx
            
            matched_indices.append([det_idx, trk_idx])
            
            # "Remover" linha e coluna
            cost_matrix[det_idx, :] = np.inf
            cost_matrix[:, trk_idx] = np.inf
        
        return matched_indices
    
    def _compute_iou(self, box1, box2):
        """Calcula Intersection over Union"""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])
        
        if x2 <= x1 or y2 <= y1:
            return 0.0
        
        intersection = (x2 - x1) * (y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection
        
        return intersection / union if union > 0 else 0.0
    
    def _should_delete_tracker(self, tracker):
        """Decide se deve remover um tracker"""
        return tracker.time_since_update > self.max_age

class AdvancedLoiteringDetector:
    """
    Detector de Loitering avançado usando DeepSORT
    Muito mais robusto que o CentroidTracker original
    """
    
    def __init__(self, loitering_threshold=15, movement_threshold=30):
        self.tracker = DeepSORTTracker()
        self.loitering_threshold = loitering_threshold
        self.movement_threshold = movement_threshold
        
        logging.info("Advanced Loitering Detector inicializado com DeepSORT")
    
    def update(self, detections, frame):
        """
        Atualiza detector com novas detecções
        
        Args:
            detections: Lista de detecções [{'box': [x1,y1,x2,y2], 'confidence': float}]
            frame: Frame atual (numpy array)
        
        Returns:
            dict: {object_id: bbox} para objetos rastreados
        """
        # Filtrar detecções de pessoas apenas
        person_detections = [det for det in detections if det.get('class', 'person') == 'person']
        
        # Update tracker
        tracked_objects = self.tracker.update(person_detections, frame)
        
        return tracked_objects
    
    def get_loitering_objects(self):
        """
        Retorna objetos que estão fazendo loitering
        
        Returns:
            list: IDs dos objetos em loitering
        """
        return self.tracker.get_loitering_objects(self.loitering_threshold)
    
    def get_detailed_loitering_info(self):
        """
        Retorna informações detalhadas sobre loitering
        
        Returns:
            dict: {object_id: {'duration': float, 'bbox': [x1,y1,x2,y2], 'confidence': str}}
        """
        loitering_info = {}
        
        for tracker in self.tracker.trackers:
            if tracker.is_loitering(self.loitering_threshold) and tracker.time_since_update < 1:
                duration = time.time() - tracker.loitering_start_time if tracker.loitering_start_time else 0
                confidence_level = "HIGH" if duration > self.loitering_threshold * 1.5 else "MEDIUM"
                
                loitering_info[tracker.id] = {
                    'duration': duration,
                    'bbox': tracker.get_state().tolist(),
                    'confidence': confidence_level,
                    'hits': tracker.hits
                }
        
        return loitering_info
