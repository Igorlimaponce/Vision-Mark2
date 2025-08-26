import logging
import numpy as np
import time
import math
from .base_node import BaseNode

class TrajectoryAnalysisNode(BaseNode):
    """
    Advanced Trajectory Analysis Node inspired by DeepSORT videos.
    
    Analyzes object trajectories for:
    - Path prediction
    - Abnormal behavior detection
    - Crowd flow analysis
    - Dwell time in areas
    - Speed pattern analysis
    
    User-configurable parameters:
    - min_trajectory_length: Minimum points for analysis
    - abnormal_speed_threshold: Speed threshold for abnormal behavior
    - prediction_frames: Number of frames to predict ahead
    - enable_crowd_analysis: Enable crowd flow analysis
    """
    
    def __init__(self, node_config):
        super().__init__(node_config)
        self.trajectory_cache = {}
        self.crowd_stats = {
            'total_objects': 0,
            'average_speed': 0.0,
            'flow_direction': None,
            'density_hotspots': []
        }
        
    def execute(self, frame, input_data, shared_tools):
        detections = input_data.get('detections', [])
        
        if not detections:
            return {'detections': detections}
        
        # Configuration from user
        min_length = int(self.config.get('min_trajectory_length', 5))
        speed_threshold = float(self.config.get('abnormal_speed_threshold', 50.0))
        prediction_frames = int(self.config.get('prediction_frames', 10))
        enable_crowd = self.config.get('enable_crowd_analysis', True)
        
        logging.debug(f"Node {self.node_id}: Analyzing trajectories for {len(detections)} objects.")
        
        enhanced_detections = []
        current_time = time.time()
        
        for det in detections:
            track_id = det.get('track_id')
            if not track_id:
                enhanced_detections.append(det)
                continue
            
            # Update trajectory cache
            current_pos = self._get_center_from_bbox(det['box'])
            
            if track_id not in self.trajectory_cache:
                self.trajectory_cache[track_id] = {
                    'positions': [],
                    'timestamps': [],
                    'speeds': [],
                    'directions': [],
                    'first_seen': current_time,
                    'last_update': current_time
                }
            
            traj_data = self.trajectory_cache[track_id]
            traj_data['positions'].append(current_pos)
            traj_data['timestamps'].append(current_time)
            traj_data['last_update'] = current_time
            
            # Keep only recent trajectory points
            max_points = 50
            if len(traj_data['positions']) > max_points:
                traj_data['positions'] = traj_data['positions'][-max_points:]
                traj_data['timestamps'] = traj_data['timestamps'][-max_points:]
            
            # Calculate trajectory metrics
            if len(traj_data['positions']) >= min_length:
                trajectory_analysis = self._analyze_trajectory(traj_data)
                
                # Add trajectory information to detection
                det['trajectory_analysis'] = trajectory_analysis
                
                # Predict future position
                if len(traj_data['positions']) >= 3:
                    predicted_pos = self._predict_position(
                        traj_data['positions'], 
                        prediction_frames
                    )
                    det['predicted_position'] = predicted_pos
                
                # Detect abnormal behavior
                abnormal_behavior = self._detect_abnormal_behavior(
                    trajectory_analysis, speed_threshold
                )
                if abnormal_behavior:
                    det['abnormal_behavior'] = abnormal_behavior
                    det['alert_level'] = 'medium'
                    logging.warning(f"Abnormal behavior detected for object {track_id}: {abnormal_behavior}")
                
                # Path complexity analysis
                path_complexity = self._calculate_path_complexity(traj_data['positions'])
                det['path_complexity'] = path_complexity
                
                # Dwell analysis
                dwell_analysis = self._analyze_dwell_time(traj_data)
                det['dwell_analysis'] = dwell_analysis
            
            enhanced_detections.append(det)
        
        # Crowd analysis
        if enable_crowd and len(enhanced_detections) > 1:
            crowd_analysis = self._analyze_crowd_flow(enhanced_detections)
            shared_tools['crowd_analysis'] = crowd_analysis
        
        # Cleanup old trajectories
        self._cleanup_old_trajectories(current_time)
        
        return {'detections': enhanced_detections}
    
    def _analyze_trajectory(self, traj_data):
        """Comprehensive trajectory analysis"""
        positions = np.array(traj_data['positions'])
        timestamps = np.array(traj_data['timestamps'])
        
        if len(positions) < 2:
            return None
        
        # Calculate speeds
        speeds = []
        directions = []
        
        for i in range(1, len(positions)):
            # Speed calculation
            distance = np.linalg.norm(positions[i] - positions[i-1])
            time_diff = timestamps[i] - timestamps[i-1]
            speed = distance / max(time_diff, 0.001)  # pixels per second
            speeds.append(speed)
            
            # Direction calculation
            direction_vector = positions[i] - positions[i-1]
            if np.linalg.norm(direction_vector) > 0:
                angle = math.atan2(direction_vector[1], direction_vector[0])
                directions.append(math.degrees(angle))
        
        # Calculate metrics
        total_distance = np.sum([np.linalg.norm(positions[i] - positions[i-1]) 
                                for i in range(1, len(positions))])
        
        straight_distance = np.linalg.norm(positions[-1] - positions[0])
        sinuosity = total_distance / max(straight_distance, 1.0)
        
        avg_speed = np.mean(speeds) if speeds else 0
        speed_variance = np.var(speeds) if speeds else 0
        
        direction_changes = self._count_direction_changes(directions)
        
        return {
            'total_distance': float(total_distance),
            'straight_distance': float(straight_distance),
            'sinuosity': float(sinuosity),
            'average_speed': float(avg_speed),
            'speed_variance': float(speed_variance),
            'max_speed': float(max(speeds)) if speeds else 0,
            'min_speed': float(min(speeds)) if speeds else 0,
            'direction_changes': direction_changes,
            'trajectory_duration': float(timestamps[-1] - timestamps[0]),
            'smoothness': float(1.0 / max(speed_variance, 0.1))  # Higher = smoother
        }
    
    def _predict_position(self, positions, frames_ahead):
        """Predict future position based on trajectory"""
        if len(positions) < 3:
            return positions[-1]
        
        # Simple linear prediction based on recent movement
        recent_positions = positions[-3:]
        
        # Calculate average velocity
        velocities = []
        for i in range(1, len(recent_positions)):
            vel = np.array(recent_positions[i]) - np.array(recent_positions[i-1])
            velocities.append(vel)
        
        avg_velocity = np.mean(velocities, axis=0)
        
        # Predict position
        current_pos = np.array(positions[-1])
        predicted_pos = current_pos + avg_velocity * frames_ahead
        
        return predicted_pos.tolist()
    
    def _detect_abnormal_behavior(self, analysis, speed_threshold):
        """Detect abnormal movement patterns"""
        if not analysis:
            return None
        
        abnormal_patterns = []
        
        # High speed
        if analysis['max_speed'] > speed_threshold:
            abnormal_patterns.append('excessive_speed')
        
        # Erratic movement (high direction changes)
        if analysis['direction_changes'] > 10:
            abnormal_patterns.append('erratic_movement')
        
        # Very low smoothness
        if analysis['smoothness'] < 0.3:
            abnormal_patterns.append('irregular_path')
        
        # High sinuosity (very winding path)
        if analysis['sinuosity'] > 3.0:
            abnormal_patterns.append('highly_winding_path')
        
        # Sudden stops (very low speed after high speed)
        if analysis['speed_variance'] > 100:
            abnormal_patterns.append('sudden_speed_changes')
        
        return abnormal_patterns if abnormal_patterns else None
    
    def _calculate_path_complexity(self, positions):
        """Calculate path complexity score"""
        if len(positions) < 3:
            return 0.0
        
        # Calculate angles between consecutive segments
        angles = []
        for i in range(2, len(positions)):
            v1 = np.array(positions[i-1]) - np.array(positions[i-2])
            v2 = np.array(positions[i]) - np.array(positions[i-1])
            
            if np.linalg.norm(v1) > 0 and np.linalg.norm(v2) > 0:
                cos_angle = np.dot(v1, v2) / (np.linalg.norm(v1) * np.linalg.norm(v2))
                angle = math.acos(np.clip(cos_angle, -1, 1))
                angles.append(angle)
        
        # Complexity = variance in angles (higher = more complex)
        return float(np.var(angles)) if angles else 0.0
    
    def _analyze_dwell_time(self, traj_data):
        """Analyze time spent in small areas"""
        positions = np.array(traj_data['positions'])
        timestamps = np.array(traj_data['timestamps'])
        
        if len(positions) < 5:
            return None
        
        # Find areas where object stayed relatively still
        dwell_areas = []
        current_cluster = []
        dwell_threshold = 30  # pixels
        
        for i, pos in enumerate(positions):
            if not current_cluster:
                current_cluster = [i]
            else:
                # Check if position is close to cluster center
                cluster_positions = positions[current_cluster]
                cluster_center = np.mean(cluster_positions, axis=0)
                
                if np.linalg.norm(pos - cluster_center) < dwell_threshold:
                    current_cluster.append(i)
                else:
                    # End current cluster if it's significant
                    if len(current_cluster) >= 5:
                        start_time = timestamps[current_cluster[0]]
                        end_time = timestamps[current_cluster[-1]]
                        dwell_areas.append({
                            'position': cluster_center.tolist(),
                            'duration': float(end_time - start_time),
                            'start_time': float(start_time),
                            'end_time': float(end_time)
                        })
                    current_cluster = [i]
        
        # Don't forget the last cluster
        if len(current_cluster) >= 5:
            cluster_positions = positions[current_cluster]
            cluster_center = np.mean(cluster_positions, axis=0)
            start_time = timestamps[current_cluster[0]]
            end_time = timestamps[current_cluster[-1]]
            dwell_areas.append({
                'position': cluster_center.tolist(),
                'duration': float(end_time - start_time),
                'start_time': float(start_time),
                'end_time': float(end_time)
            })
        
        return {
            'dwell_areas': dwell_areas,
            'total_dwell_time': sum(area['duration'] for area in dwell_areas),
            'max_dwell_duration': max([area['duration'] for area in dwell_areas]) if dwell_areas else 0
        }
    
    def _analyze_crowd_flow(self, detections):
        """Analyze overall crowd movement patterns"""
        if len(detections) < 2:
            return None
        
        speeds = []
        directions = []
        positions = []
        
        for det in detections:
            if 'trajectory_analysis' in det:
                analysis = det['trajectory_analysis']
                speeds.append(analysis.get('average_speed', 0))
                
            if 'direction' in det:
                directions.append(det['direction'])
                
            box = det['box']
            pos = [(box[0] + box[2]) / 2, (box[1] + box[3]) / 2]
            positions.append(pos)
        
        # Calculate crowd metrics
        avg_speed = np.mean(speeds) if speeds else 0
        speed_std = np.std(speeds) if speeds else 0
        
        # Dominant direction
        if directions:
            # Convert to vectors and average
            direction_vectors = []
            for angle in directions:
                rad = math.radians(angle)
                direction_vectors.append([math.cos(rad), math.sin(rad)])
            
            avg_direction_vector = np.mean(direction_vectors, axis=0)
            dominant_direction = math.degrees(math.atan2(avg_direction_vector[1], avg_direction_vector[0]))
        else:
            dominant_direction = None
        
        # Density analysis
        if positions:
            positions = np.array(positions)
            density_center = np.mean(positions, axis=0)
            density_spread = np.std(positions, axis=0)
        else:
            density_center = None
            density_spread = None
        
        return {
            'object_count': len(detections),
            'average_speed': float(avg_speed),
            'speed_deviation': float(speed_std),
            'dominant_direction': float(dominant_direction) if dominant_direction else None,
            'density_center': density_center.tolist() if density_center is not None else None,
            'density_spread': density_spread.tolist() if density_spread is not None else None,
            'crowd_coherence': float(1.0 / max(speed_std, 0.1))  # Higher = more coherent movement
        }
    
    def _count_direction_changes(self, directions):
        """Count significant direction changes"""
        if len(directions) < 2:
            return 0
        
        changes = 0
        threshold = 45  # degrees
        
        for i in range(1, len(directions)):
            angle_diff = abs(directions[i] - directions[i-1])
            # Handle wrapping around 360 degrees
            if angle_diff > 180:
                angle_diff = 360 - angle_diff
            
            if angle_diff > threshold:
                changes += 1
        
        return changes
    
    def _get_center_from_bbox(self, bbox):
        """Extract center from bounding box"""
        return [(bbox[0] + bbox[2]) / 2, (bbox[1] + bbox[3]) / 2]
    
    def _cleanup_old_trajectories(self, current_time, max_age=300):
        """Remove old trajectory data"""
        to_remove = []
        for track_id, data in self.trajectory_cache.items():
            if current_time - data['last_update'] > max_age:
                to_remove.append(track_id)
        
        for track_id in to_remove:
            del self.trajectory_cache[track_id]
