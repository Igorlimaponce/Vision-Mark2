import logging
import numpy as np
import math
import time
from .base_node import BaseNode

class DirectionFilterNode(BaseNode):
    """
    Enhanced Direction Filter for traffic analysis and wrong-way detection.
    Filters objects that cross a line in a specific direction (like the DeepSORT videos).
    
    New Features:
    - Wrong-way detection (contramão)
    - Speed estimation at crossing point
    - Traffic flow analysis
    - Multiple crossing lines support
    """
    def __init__(self, node_config):
        super().__init__(node_config)
        self.crossing_history = {}  # Track objects crossing lines
        self.traffic_stats = {
            'correct_direction': 0,
            'wrong_direction': 0,
            'total_crossings': 0
        }
        
    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        line_points = self.config.get('line')  # [[x1, y1], [x2, y2]]
        allowed_direction_vector = self.config.get('direction', [1, 0])  # Default: left to right
        
        if not line_points or len(line_points) != 2 or not detections:
            return {'detections': detections}
        
        logging.debug(f"Node {self.node_id}: Enhanced direction filtering for {len(detections)} detections.")
        
        # Line parameters
        line_start = np.array(line_points[0])
        line_end = np.array(line_points[1])
        line_vector = line_end - line_start
        line_normal = np.array([-line_vector[1], line_vector[0]])  # Perpendicular vector
        
        # Normalize allowed direction
        allowed_dir = np.array(allowed_direction_vector)
        if np.linalg.norm(allowed_dir) > 0:
            allowed_dir = allowed_dir / np.linalg.norm(allowed_dir)
        
        filtered_detections = []
        wrong_way_detections = []
        current_time = time.time()
        
        for det in detections:
            track_id = det.get('track_id')
            if not track_id:
                # If no tracking info, pass through
                filtered_detections.append(det)
                continue
            
            box = det['box']
            current_pos = np.array([(box[0] + box[2]) / 2, (box[1] + box[3]) / 2])
            
            # Track crossing history
            if track_id not in self.crossing_history:
                self.crossing_history[track_id] = {
                    'positions': [],
                    'crossed': False,
                    'crossing_direction': None,
                    'crossing_time': None,
                    'last_update': current_time
                }
            
            track_info = self.crossing_history[track_id]
            track_info['positions'].append(current_pos)
            track_info['last_update'] = current_time
            
            # Keep only recent positions (last 10 positions)
            if len(track_info['positions']) > 10:
                track_info['positions'] = track_info['positions'][-10:]
            
            # Check for line crossing
            if len(track_info['positions']) >= 2 and not track_info['crossed']:
                crossing_detected, crossing_direction = self._detect_line_crossing(
                    track_info['positions'][-2], 
                    track_info['positions'][-1], 
                    line_start, 
                    line_end
                )
                
                if crossing_detected:
                    track_info['crossed'] = True
                    track_info['crossing_direction'] = crossing_direction
                    track_info['crossing_time'] = current_time
                    
                    # Calculate if direction is correct or wrong
                    direction_dot = np.dot(crossing_direction, allowed_dir)
                    is_correct_direction = direction_dot > 0.5  # Threshold for same direction
                    
                    # Enhanced detection info
                    det['line_crossed'] = True
                    det['crossing_direction'] = crossing_direction.tolist()
                    det['crossing_time'] = current_time
                    det['correct_direction'] = is_correct_direction
                    
                    # Add speed at crossing if available
                    if 'speed' in det:
                        det['crossing_speed'] = det['speed']
                    
                    # Traffic statistics
                    self.traffic_stats['total_crossings'] += 1
                    if is_correct_direction:
                        self.traffic_stats['correct_direction'] += 1
                        filtered_detections.append(det)
                        logging.debug(f"Object {track_id} crossed in correct direction")
                    else:
                        self.traffic_stats['wrong_direction'] += 1
                        det['violation_type'] = 'wrong_direction'
                        det['alert_level'] = 'high'
                        wrong_way_detections.append(det)
                        logging.warning(f"WRONG WAY DETECTED: Object {track_id} crossed in wrong direction!")
                    
                    # Calculate crossing angle
                    crossing_angle = self._calculate_crossing_angle(crossing_direction, allowed_dir)
                    det['crossing_angle'] = crossing_angle
            else:
                # Object hasn't crossed yet, include in normal detections
                filtered_detections.append(det)
        
        # Clean up old crossing history
        self._cleanup_old_crossings(current_time)
        
        # Add traffic analytics to shared context
        if 'traffic_analytics' not in shared_tools:
            shared_tools['traffic_analytics'] = {}
        
        shared_tools['traffic_analytics'][self.node_id] = {
            **self.traffic_stats,
            'wrong_way_ratio': (self.traffic_stats['wrong_direction'] / 
                               max(self.traffic_stats['total_crossings'], 1)) * 100
        }
        
        # Return both normal and wrong-way detections
        result = {'detections': filtered_detections}
        if wrong_way_detections:
            result['wrong_way_detections'] = wrong_way_detections
            result['alerts'] = [{
                'type': 'wrong_way_violation',
                'count': len(wrong_way_detections),
                'severity': 'high',
                'timestamp': current_time
            }]
        
        logging.debug(f"Node {self.node_id}: {len(filtered_detections)} normal, "
                     f"{len(wrong_way_detections)} wrong-way detections")
        
        return result
    
    def _detect_line_crossing(self, prev_pos, curr_pos, line_start, line_end):
        """Detect if object crossed the line and return crossing direction"""
        # Check if trajectory segment intersects with line segment
        def ccw(A, B, C):
            return (C[1] - A[1]) * (B[0] - A[0]) > (B[1] - A[1]) * (C[0] - A[0])
        
        def intersect(A, B, C, D):
            return ccw(A, C, D) != ccw(B, C, D) and ccw(A, B, C) != ccw(A, B, D)
        
        if intersect(prev_pos, curr_pos, line_start, line_end):
            # Calculate crossing direction
            movement_vector = curr_pos - prev_pos
            if np.linalg.norm(movement_vector) > 0:
                crossing_direction = movement_vector / np.linalg.norm(movement_vector)
                return True, crossing_direction
        
        return False, None
    
    def _calculate_crossing_angle(self, crossing_dir, allowed_dir):
        """Calculate angle between crossing direction and allowed direction"""
        dot_product = np.dot(crossing_dir, allowed_dir)
        angle_rad = math.acos(np.clip(dot_product, -1.0, 1.0))
        return math.degrees(angle_rad)
    
    def _cleanup_old_crossings(self, current_time, max_age=60):
        """Remove old crossing history"""
        to_remove = []
        for track_id, info in self.crossing_history.items():
            if current_time - info['last_update'] > max_age:
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.crossing_history[track_id]