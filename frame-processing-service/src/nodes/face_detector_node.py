import logging
from retinaface import RetinaFace
from .base_node import BaseNode

class FaceDetectorNode(BaseNode):
    """
    Detecta a localização de faces no frame usando RetinaFace.
    """
    def __init__(self, node_info):
        super().__init__(node_info)
        # O modelo é carregado uma vez por instância do nó
        self.detector = RetinaFace.build_model()
    
    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        logging.debug(f"Node {self.node_id}: Executando detecção de faces.")
        
        # RetinaFace espera um formato de imagem BGR, que o OpenCV já fornece.
        try:
            # A função detect_faces retorna um dicionário com as faces e suas caixas
            detected_faces = RetinaFace.detect_faces(frame, model=self.detector)
        except Exception as e:
            # Se não houver faces, a lib pode lançar uma exceção
            logging.debug(f"Node {self.node_id}: Nenhuma face detectada ou erro na detecção: {e}")
            return {'faces': []}
            
        faces = []
        if isinstance(detected_faces, dict):
            for key in detected_faces:
                face_data = detected_faces[key]
                x1, y1, x2, y2 = face_data['facial_area']
                faces.append({
                    'box': [x1, y1, x2, y2],
                    'confidence': face_data['score']
                })
        
        logging.debug(f"Node {self.node_id}: {len(faces)} faces detectadas.")
        return {'faces': faces}