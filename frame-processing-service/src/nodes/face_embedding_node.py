import logging
import numpy as np
from deepface import DeepFace
from .base_node import BaseNode

class FaceEmbeddingNode(BaseNode):
    """
    Extrai um vetor de embedding de cada face detectada usando ArcFace.
    """
    def execute(self, frame, input_data: dict, shared_tools: dict) -> dict:
        faces = input_data.get('faces', [])
        if not faces:
            return {'embeddings': []}

        logging.debug(f"Node {self.node_id}: Extraindo embeddings para {len(faces)} faces.")
        
        embeddings_data = []
        for face_data in faces:
            x1, y1, x2, y2 = face_data['box']
            
            # Recorta a face do frame (com uma pequena margem)
            face_img = frame[y1:y2, x1:x2]
            
            if face_img.size == 0:
                continue

            try:
                # Usa ArcFace para gerar o embedding.
                # DeepFace lida com a normalização e processamento.
                embedding_vector = DeepFace.represent(
                    img_path=face_img,
                    model_name='ArcFace',
                    enforce_detection=False # Já detectamos a face
                )[0]['embedding']
                
                embeddings_data.append({
                    'box': face_data['box'],
                    'embedding': embedding_vector
                })
            except Exception as e:
                logging.warning(f"Node {self.node_id}: Não foi possível gerar embedding para uma face: {e}")

        return {'embeddings': embeddings_data}