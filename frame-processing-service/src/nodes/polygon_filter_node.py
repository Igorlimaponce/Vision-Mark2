import logging
import cv2
import numpy as np
import time
from .base_node import BaseNode

class PolygonFilterNode(BaseNode):
    """
    Enhanced Polygon Filter with zone crossing detection and dwell time analysis.
    Filters detections to include only those inside a user-defined polygon.
    
    New Features (based on DeepSORT videos):
    - Zone crossing detection (enter/exit events)
    - Dwell time calculation
    - Zone density analysis
    - Speed estimation within zone
    """
    def __init__(self, node_config):
        super().__init__(node_config)
        self.zone_history = {}  # Track objects in zone over time
        self.zone_events = []   # Log of zone events
        
    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        polygon_points = self.config.get('polygon')
        
        if not polygon_points or not detections:
            return {'detections': []}
            
        logging.debug(f"Node {self.node_id}: Enhanced polygon filtering for {len(detections)} detections.")
        
        polygon_np = np.array(polygon_points, dtype=np.int32)
        filtered_detections = []
        current_time = time.time()
        
        # Enhanced zone analysis
        zone_stats = {
            'objects_in_zone': 0,
            'new_entries': 0,
            'exits': 0,
            'total_dwell_time': 0,
            'zone_density': 0.0
        }

        for det in detections:
            box = det['box']
            # Enhanced reference point (center bottom of bounding box)
            check_point = (int((box[0] + box[2]) / 2), int(box[3]))
            
            is_inside = cv2.pointPolygonTest(polygon_np, check_point, False) >= 0
            
            # Track object history for zone events
            track_id = det.get('track_id', f"unknown_{hash(str(box))}")
            
            if track_id not in self.zone_history:
                self.zone_history[track_id] = {
                    'first_seen': current_time,
                    'last_seen': current_time,
                    'was_inside': False,
                    'entry_time': None,
                    'total_time_in_zone': 0
                }
            
            zone_info = self.zone_history[track_id]
            zone_info['last_seen'] = current_time
            
            # Detect zone crossing events
            if not zone_info['was_inside'] and is_inside:
                # Object entered zone
                zone_info['entry_time'] = current_time
                zone_info['was_inside'] = True
                zone_stats['new_entries'] += 1
                
                # Add zone event to detection
                det['zone_event'] = 'enter'
                det['zone_entry_time'] = current_time
                
                logging.info(f"Object {track_id} entered zone")
                
            elif zone_info['was_inside'] and not is_inside:
                # Object exited zone
                if zone_info['entry_time']:
                    dwell_time = current_time - zone_info['entry_time']
                    zone_info['total_time_in_zone'] += dwell_time
                    det['zone_dwell_time'] = dwell_time
                
                zone_info['was_inside'] = False
                zone_info['entry_time'] = None
                zone_stats['exits'] += 1
                
                det['zone_event'] = 'exit'
                logging.info(f"Object {track_id} exited zone")
                
            elif zone_info['was_inside'] and is_inside:
                # Object still in zone - calculate current dwell time
                if zone_info['entry_time']:
                    current_dwell = current_time - zone_info['entry_time']
                    det['zone_dwell_time'] = current_dwell
                    det['zone_event'] = 'dwell'
            
            # Include detection if inside polygon
            if is_inside:
                # Enhanced detection info
                det['zone_position'] = check_point
                det['zone_polygon'] = polygon_points
                
                # Add zone-specific analysis (from videos)
                if 'speed' in det:
                    det['speed_in_zone'] = det['speed']
                if 'direction' in det:
                    det['direction_in_zone'] = det['direction']
                    
                filtered_detections.append(det)
                zone_stats['objects_in_zone'] += 1
        
        # Calculate zone density (objects per polygon area)
        if polygon_points:
            polygon_area = cv2.contourArea(polygon_np)
            zone_stats['zone_density'] = zone_stats['objects_in_zone'] / (polygon_area / 1000)  # objects per 1000 pixels²
        
        # Clean up old zone history
        self._cleanup_old_history(current_time)
        
        # Add zone statistics to shared context
        if 'zone_analytics' not in shared_tools:
            shared_tools['zone_analytics'] = {}
        shared_tools['zone_analytics'][self.node_id] = zone_stats
        
        logging.debug(f"Node {self.node_id}: {len(filtered_detections)} objects in zone. "
                     f"Entries: {zone_stats['new_entries']}, Exits: {zone_stats['exits']}, "
                     f"Density: {zone_stats['zone_density']:.2f}")
        
        return {'detections': filtered_detections}
    
    def _cleanup_old_history(self, current_time, max_age=300):
        """Remove old tracking history (older than 5 minutes)"""
        to_remove = []
        for track_id, info in self.zone_history.items():
            if current_time - info['last_seen'] > max_age:
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.zone_history[track_id]