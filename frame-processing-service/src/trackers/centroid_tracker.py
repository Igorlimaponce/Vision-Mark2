from collections import OrderedDict
import numpy as np
import time

class CentroidTracker:
    def __init__(self, max_disappeared=50, loitering_time_threshold=10):
        self.next_object_id = 0
        self.objects = OrderedDict()
        self.disappeared = OrderedDict()
        self.loitering_info = OrderedDict()
        self.loitering_alerts_triggered = set()

        self.max_disappeared = max_disappeared
        self.loitering_time_threshold = loitering_time_threshold

    def register(self, centroid):
        self.objects[self.next_object_id] = centroid
        self.disappeared[self.next_object_id] = 0
        self.loitering_info[self.next_object_id] = {
            'start_time': time.time(),
            'positions': [centroid]
        }
        self.next_object_id += 1

    def deregister(self, object_id):
        del self.objects[object_id]
        del self.disappeared[object_id]
        del self.loitering_info[object_id]
        self.loitering_alerts_triggered.discard(object_id)


    def update(self, rects):
        if len(rects) == 0:
            for object_id in list(self.disappeared.keys()):
                self.disappeared[object_id] += 1
                if self.disappeared[object_id] > self.max_disappeared:
                    self.deregister(object_id)
            return self.objects

        input_centroids = np.zeros((len(rects), 2), dtype="int")
        for (i, (x1, y1, x2, y2)) in enumerate(rects):
            cx = int((x1 + x2) / 2.0)
            cy = int((y1 + y2) / 2.0)
            input_centroids[i] = (cx, cy)

        if len(self.objects) == 0:
            for i in range(len(input_centroids)):
                self.register(input_centroids[i])
        else:
            object_ids = list(self.objects.keys())
            object_centroids = list(self.objects.values())

            D = np.linalg.norm(np.array(object_centroids)[:, np.newaxis] - input_centroids, axis=2)
            rows = D.min(axis=1).argsort()
            cols = D.argmin(axis=1)[rows]

            used_rows = set()
            used_cols = set()

            for (row, col) in zip(rows, cols):
                # ... (parte do loop inalterada)
                object_id = object_ids[row]
                self.objects[object_id] = input_centroids[col]
                self.boxes[object_id] = rects[col]
                self.disappeared[object_id] = 0
                self.position_history[object_id].append(self.objects[object_id]) # Adiciona posição atual ao histórico
                
                # Reseta o tempo de vadiagem se o objeto se mover significativamente
                if self._has_moved(object_id):
                    self.loitering_start_time[object_id] = None
                # Se não se moveu e não estava a vadiar, inicia o cronómetro
                elif self.loitering_start_time[object_id] is None:
                    self.loitering_start_time[object_id] = time.time()
                    
                used_rows.add(row)
                used_cols.add(col)

            if D.shape[0] >= D.shape[1]:
                for row in unused_rows:
                    object_id = object_ids[row]
                    self.disappeared[object_id] += 1
                    if self.disappeared[object_id] > self.max_disappeared:
                        self.deregister(object_id)
            else:
                for col in unused_cols:
                    self.register(input_centroids[col])
        
        return self.objects

    def _has_moved(self, object_id, movement_threshold=20):
        """Verifica se um objeto se moveu significativamente com base no seu histórico."""
        if len(self.position_history[object_id]) < self.position_history[object_id].maxlen:
            return True # Ainda não temos histórico suficiente, assume que está a mover-se

        # Calcula o deslocamento entre a posição mais antiga e a mais recente no histórico
        positions = np.array(list(self.position_history[object_id]))
        displacement = np.linalg.norm(positions[0] - positions[-1])
        
        return displacement > movement_threshold

    def get_loitering_alerts(self, time_threshold_seconds: int) -> list:
        """Retorna uma lista de IDs de objetos que estão a vadiar."""
        loitering_ids = []
        current_time = time.time()
        for object_id, start_time in self.loitering_start_time.items():
            if start_time is not None:
                duration = current_time - start_time
                if duration > time_threshold_seconds:
                    loitering_ids.append(object_id)
        return loitering_ids
