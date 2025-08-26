"""
Hybrid Tracker - Compatibilidade entre CentroidTracker (antigo) e DeepSORT (novo)
Permite transição suave e fallback para cenários com recursos limitados
"""

import logging
import time
import numpy as np
from typing import Dict, List, Optional, Union
from .centroid_tracker import CentroidTracker
from .advanced_tracker import DeepSORTTracker, AdvancedLoiteringDetector

class HybridTracker:
    """
    Tracker híbrido que escolhe automaticamente entre CentroidTracker e DeepSORT
    baseado na disponibilidade de recursos e configuração
    """
    
    def __init__(self, 
                 use_advanced=True, 
                 fallback_on_error=True,
                 max_disappeared=30,
                 loitering_threshold=15):
        """
        Args:
            use_advanced: Se True, tenta usar DeepSORT; se False, usa CentroidTracker
            fallback_on_error: Se True, faz fallback para CentroidTracker em caso de erro
            max_disappeared: Máximo de frames que um objeto pode desaparecer
            loitering_threshold: Threshold em segundos para detecção de loitering
        """
        self.use_advanced = use_advanced
        self.fallback_on_error = fallback_on_error
        self.max_disappeared = max_disappeared
        self.loitering_threshold = loitering_threshold
        
        # Estado atual do tracker
        self.current_tracker_type = None
        self.tracker = None
        
        # Estatísticas de performance
        self.stats = {
            'total_updates': 0,
            'advanced_tracker_errors': 0,
            'fallback_activations': 0,
            'current_mode': 'none'
        }
        
        # Inicializar tracker
        self._initialize_tracker()
    
    def _initialize_tracker(self):
        """Inicializa o tracker baseado na configuração"""
        try:
            if self.use_advanced:
                self._init_advanced_tracker()
            else:
                self._init_centroid_tracker()
        except Exception as e:
            logging.error(f"Erro ao inicializar tracker: {e}")
            if self.fallback_on_error and self.use_advanced:
                logging.info("Fazendo fallback para CentroidTracker")
                self._init_centroid_tracker()
            else:
                raise
    
    def _init_advanced_tracker(self):
        """Inicializa DeepSORT tracker"""
        try:
            self.tracker = AdvancedLoiteringDetector(
                loitering_threshold=self.loitering_threshold
            )
            self.current_tracker_type = 'deepsort'
            self.stats['current_mode'] = 'advanced'
            logging.info("✅ DeepSORT Tracker inicializado com sucesso")
        except Exception as e:
            logging.error(f"❌ Erro ao inicializar DeepSORT: {e}")
            raise
    
    def _init_centroid_tracker(self):
        """Inicializa CentroidTracker (fallback)"""
        self.tracker = CentroidTracker(
            max_disappeared=self.max_disappeared,
            loitering_time_threshold=self.loitering_threshold
        )
        self.current_tracker_type = 'centroid'
        self.stats['current_mode'] = 'fallback'
        logging.info("✅ CentroidTracker inicializado (modo fallback)")
    
    def update(self, detections: List[Dict], frame: Optional[np.ndarray] = None) -> Dict:
        """
        Atualiza tracker com novas detecções
        
        Args:
            detections: Lista de detecções
            frame: Frame atual (requerido para DeepSORT)
        
        Returns:
            dict: {object_id: bbox} mapeamento de objetos rastreados
        """
        self.stats['total_updates'] += 1
        
        try:
            if self.current_tracker_type == 'deepsort':
                return self._update_advanced(detections, frame)
            else:
                return self._update_centroid(detections)
                
        except Exception as e:
            logging.error(f"Erro durante update do tracker: {e}")
            self.stats['advanced_tracker_errors'] += 1
            
            # Tentar fallback se possível
            if (self.current_tracker_type == 'deepsort' and 
                self.fallback_on_error):
                logging.warning("Fazendo fallback para CentroidTracker devido a erro")
                self._init_centroid_tracker()
                self.stats['fallback_activations'] += 1
                return self._update_centroid(detections)
            else:
                raise
    
    def _update_advanced(self, detections: List[Dict], frame: Optional[np.ndarray]) -> Dict:
        """Update usando DeepSORT"""
        # Converter formato se necessário
        formatted_detections = self._format_detections_for_advanced(detections)
        
        # Update tracker
        tracked_objects = self.tracker.update(formatted_detections, frame)
        
        return tracked_objects
    
    def _update_centroid(self, detections: List[Dict]) -> Dict:
        """Update usando CentroidTracker"""
        # Extrair bounding boxes
        rects = [det['box'] for det in detections if 'box' in det]
        
        # Update tracker
        tracked_objects = self.tracker.update(rects)
        
        return tracked_objects
    
    def _format_detections_for_advanced(self, detections: List[Dict]) -> List[Dict]:
        """Converte detecções para formato esperado pelo DeepSORT"""
        formatted = []
        for det in detections:
            formatted_det = {
                'box': det.get('box', [0, 0, 0, 0]),
                'confidence': det.get('confidence', 0.5),
                'class': det.get('class', 'person')
            }
            formatted.append(formatted_det)
        return formatted
    
    def get_loitering_objects(self, threshold_seconds: Optional[int] = None) -> List[int]:
        """
        Retorna IDs dos objetos fazendo loitering
        
        Args:
            threshold_seconds: Override do threshold padrão
        
        Returns:
            list: IDs dos objetos em loitering
        """
        if threshold_seconds is None:
            threshold_seconds = self.loitering_threshold
        
        try:
            if self.current_tracker_type == 'deepsort':
                return self.tracker.get_loitering_objects()
            else:
                return self.tracker.get_loitering_alerts(threshold_seconds)
        except Exception as e:
            logging.error(f"Erro ao obter objetos loitering: {e}")
            return []
    
    def get_detailed_loitering_info(self) -> Dict:
        """
        Retorna informações detalhadas sobre loitering
        Funciona apenas com DeepSORT
        """
        if self.current_tracker_type == 'deepsort':
            try:
                return self.tracker.get_detailed_loitering_info()
            except Exception as e:
                logging.error(f"Erro ao obter info detalhada de loitering: {e}")
                return {}
        else:
            # Para CentroidTracker, retornar informação básica
            loitering_ids = self.get_loitering_objects()
            basic_info = {}
            for obj_id in loitering_ids:
                basic_info[obj_id] = {
                    'duration': self.loitering_threshold,  # Aproximação
                    'bbox': [0, 0, 0, 0],  # Não disponível em CentroidTracker
                    'confidence': 'MEDIUM',
                    'hits': 1
                }
            return basic_info
    
    def get_tracker_stats(self) -> Dict:
        """Retorna estatísticas do tracker"""
        return {
            **self.stats,
            'tracker_type': self.current_tracker_type,
            'is_advanced': self.current_tracker_type == 'deepsort',
            'loitering_threshold': self.loitering_threshold
        }
    
    def switch_tracker_mode(self, use_advanced: bool):
        """
        Permite trocar o modo do tracker dinamicamente
        
        Args:
            use_advanced: True para DeepSORT, False para CentroidTracker
        """
        if use_advanced == (self.current_tracker_type == 'deepsort'):
            return  # Já está no modo correto
        
        logging.info(f"Trocando tracker de {self.current_tracker_type} para {'deepsort' if use_advanced else 'centroid'}")
        
        self.use_advanced = use_advanced
        try:
            self._initialize_tracker()
        except Exception as e:
            logging.error(f"Erro ao trocar modo do tracker: {e}")
            if self.fallback_on_error:
                self._init_centroid_tracker()
    
    def reset(self):
        """Reset completo do tracker"""
        logging.info("Fazendo reset completo do tracker")
        self.stats = {
            'total_updates': 0,
            'advanced_tracker_errors': 0,
            'fallback_activations': 0,
            'current_mode': 'none'
        }
        self._initialize_tracker()

class TrackerFactory:
    """
    Factory para criar trackers baseado em configuração
    """
    
    @staticmethod
    def create_tracker(config: Dict) -> Union[HybridTracker, CentroidTracker, AdvancedLoiteringDetector]:
        """
        Cria tracker baseado na configuração
        
        Args:
            config: Dicionário com configurações do tracker
        
        Returns:
            Instância do tracker apropriado
        """
        tracker_type = config.get('type', 'hybrid').lower()
        
        if tracker_type == 'hybrid':
            return HybridTracker(
                use_advanced=config.get('use_advanced', True),
                fallback_on_error=config.get('fallback_on_error', True),
                max_disappeared=config.get('max_disappeared', 30),
                loitering_threshold=config.get('loitering_threshold', 15)
            )
        
        elif tracker_type == 'deepsort':
            return AdvancedLoiteringDetector(
                loitering_threshold=config.get('loitering_threshold', 15)
            )
        
        elif tracker_type == 'centroid':
            return CentroidTracker(
                max_disappeared=config.get('max_disappeared', 50),
                loitering_time_threshold=config.get('loitering_threshold', 10)
            )
        
        else:
            logging.warning(f"Tipo de tracker desconhecido: {tracker_type}. Usando hybrid.")
            return TrackerFactory.create_tracker({'type': 'hybrid'})

# Função de conveniência para retrocompatibilidade
def create_compatible_tracker(use_advanced=True, **kwargs):
    """
    Cria um tracker compatível com o código existente
    Mantém a mesma interface do CentroidTracker
    """
    return HybridTracker(use_advanced=use_advanced, **kwargs)
