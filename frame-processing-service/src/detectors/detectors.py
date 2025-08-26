import logging
import os
import time
from ultralytics import YOLO

MODELS_PATH = os.getenv("MODELS_PATH", "/app/models")

class ObjectDetector:
    """
    Carrega um modelo YOLOv8 e o otimiza com TensorRT se possível.
    Gerencia um cache de classe para reter modelos carregados e otimizados.
    """
    _model_cache = {}

    def __init__(self, model_filename: str):
        """
        Inicializa o detector com um nome de arquivo de modelo específico.
        Tenta carregar a versão otimizada (TensorRT) se existir,
        caso contrário, carrega o modelo .pt e tenta convertê-lo.
        """
        if not model_filename:
            raise ValueError("O nome do arquivo do modelo não pode ser vazio.")
        
        self.model_filename = model_filename
        
        # Usa o cache de classe se o modelo já foi carregado e otimizado
        if model_filename in ObjectDetector._model_cache:
            self.model = ObjectDetector._model_cache[model_filename]
            logging.debug(f"Modelo '{model_filename}' carregado do cache.")
        else:
            self.model = self._load_and_optimize_model()
            ObjectDetector._model_cache[model_filename] = self.model

    def _load_and_optimize_model(self):
        """
        Lógica central para carregar, otimizar (com TensorRT) e fazer cache de um modelo.
        """
        pt_path = os.path.join(MODELS_PATH, self.model_filename)
        engine_path = pt_path.replace('.pt', '.engine')

        if not os.path.exists(pt_path):
            logging.error(f"Arquivo de modelo '{self.model_filename}' não encontrado em '{MODELS_PATH}'. Carregando modelo padrão.")
            # Carrega o modelo padrão como fallback para evitar que o serviço quebre
            return YOLO('yolov8n.pt') 

        # 1. Priorizar o modelo TensorRT (.engine) se ele já existir
        if os.path.exists(engine_path):
            try:
                logging.info(f"Carregando modelo TensorRT otimizado de: {engine_path}")
                return YOLO(engine_path)
            except Exception as e:
                logging.warning(f"Falha ao carregar modelo TensorRT '{engine_path}': {e}. Tentando com o arquivo .pt.")

        # 2. Se não houver .engine, carregar o .pt e tentar exportar
        logging.info(f"Carregando modelo PyTorch de: {pt_path}")
        model = YOLO(pt_path)
        
        try:
            logging.info(f"Tentando exportar '{self.model_filename}' para o formato TensorRT. Isso pode levar alguns minutos...")
            model.export(format='engine', half=True, dynamic=True, device=0) 
            logging.info(f"Modelo exportado com sucesso para '{engine_path}'.")
            # Retorna o modelo recém carregado a partir do engine otimizado
            return YOLO(engine_path)
        except Exception as e:
            logging.warning(f"Não foi possível exportar o modelo para TensorRT: {e}. Isso é esperado se não houver GPU NVIDIA. Usando modelo PyTorch (.pt).")
            # Retorna o modelo .pt original se a exportação falhar
            return model

    def detect(self, frame, classes_to_detect=None, confidence_threshold=0.5):
        """
        Realiza a detecção de objetos no frame.
        """
        results = self.model.predict(
            source=frame,
            classes=classes_to_detect,
            conf=confidence_threshold,
            verbose=False # Evita logs excessivos do YOLO a cada frame
        )
        
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                detections.append({
                    "box": [x1, y1, x2, y2],
                    "confidence": float(box.conf),
                    "class_name": self.model.names[int(box.cls)],
                    "class_id": int(box.cls)
                })
        return detections


