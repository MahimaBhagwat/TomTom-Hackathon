import numpy as np
from typing import Dict, List, Tuple, Optional
from datetime import datetime, timedelta
import json
from scipy.stats import zscore
from geojson import LineString, Feature, FeatureCollection
import logging

logger = logging.getLogger(__name__)

class DWGPAS:
    """
    Dynamic Weighted Graph-based Path Assessment System
    Implements the algorithm described in the project documentation
    """
    
    def __init__(self, config: Optional[dict] = None):
        """
        Initialize DWGPAS with configuration
        
        Args:
            config: Dictionary containing configuration parameters
        """
        self.config = config or {
            'base_weights': {
                'crime': 0.3,
                'lighting': 0.2,
                'population': 0.15,
                'traffic': 0.15,
                'weather': 0.1,
                'time_of_day': 0.1
            },
            'time_decay_hours': 24,  # How quickly incident impact decays over time
            'anomaly_threshold': 2.0,  # Z-score threshold for anomaly detection
            'max_route_segments': 1000,  # Safety limit for route segmentation
        }
        
        # Initialize risk factor caches
        self.risk_factors_cache = {}
        self.last_updated = datetime.min
    
    async def calculate_safest_route(
        self,
        start: Tuple[float, float],
        end: Tuple[float, float],
        preference: float = 0.5,
        departure_time: Optional[datetime] = None,
        avoid_areas: Optional[List[dict]] = None
    ) -> dict:
        """
        Calculate the safest route between two points
        
        Args:
            start: Tuple of (latitude, longitude) for start point
            end: Tuple of (latitude, longitude) for end point
            preference: Float between 0 (fastest) and 1 (safest)
            departure_time: Optional datetime for time-aware routing
            avoid_areas: List of areas to avoid
            
        Returns:
            Dictionary containing route information
        """
        departure_time = departure_time or datetime.utcnow()
        
        try:
            # 1. Get base route from TomTom API
            base_route = await self._get_base_route(start, end, departure_time, avoid_areas)
            
            # 2. Segment the route for detailed analysis
            segments = self._segment_route(base_route)
            
            # 3. Fetch risk factors for each segment
            risk_factors = await self._fetch_risk_factors(segments, departure_time)
            
            # 4. Calculate safety scores for each segment
            scored_segments = self._calculate_segment_scores(segments, risk_factors, departure_time)
            
            # 5. Apply user preference to balance safety and speed
            optimal_route = self._optimize_route(scored_segments, preference)
            
            # 6. Calculate overall route metrics
            route_metrics = self._calculate_route_metrics(optimal_route)
            
            return {
                'status': 'success',
                'route': optimal_route,
                'metrics': route_metrics,
                'preference_applied': preference,
                'departure_time': departure_time.isoformat(),
                'processed_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error calculating safest route: {str(e)}", exc_info=True)
            return {
                'status': 'error',
                'message': str(e),
                'code': 'ROUTE_CALCULATION_ERROR'
            }
    
    async def _get_base_route(
        self, 
        start: Tuple[float, float], 
        end: Tuple[float, float],
        departure_time: datetime,
        avoid_areas: Optional[List[dict]] = None
    ) -> dict:
        """
        Get base route from TomTom Routing API
        """
        # This would be implemented to call the TomTom Routing API
        # For now, return a mock response
        return {
            'start': start,
            'end': end,
            'waypoints': [],
            'distance': 0,
            'duration': 0,
            'geometry': {
                'type': 'LineString',
                'coordinates': [start, end]
            }
        }
    
    def _segment_route(self, route: dict, max_segment_length: int = 100) -> List[dict]:
        """
        Split route into smaller segments for detailed analysis
        
        Args:
            route: Route dictionary containing geometry
            max_segment_length: Maximum segment length in meters
            
        Returns:
            List of route segments
        """
        # This is a simplified implementation
        # In a real implementation, this would use a proper line segmentation algorithm
        # that respects road network topology
        
        segments = []
        coords = route['geometry']['coordinates']
        
        for i in range(len(coords) - 1):
            segment = {
                'start': coords[i],
                'end': coords[i + 1],
                'segment_id': f"seg_{i}",
                'length': self._calculate_distance(coords[i], coords[i + 1])
            }
            segments.append(segment)
        
        return segments
    
    async def _fetch_risk_factors(
        self, 
        segments: List[dict], 
        timestamp: datetime
    ) -> Dict[str, dict]:
        """
        Fetch risk factors for each route segment
        """
        # This would fetch data from various sources:
        # - Crime data from police APIs or historical database
        # - Lighting data from city infrastructure
        # - Population density from census data
        # - Traffic data from TomTom Traffic API
        # - Weather data from OpenWeather API
        
        risk_factors = {}
        
        for segment in segments:
            segment_id = segment['segment_id']
            
            # Mock risk factors - replace with real data sources
            risk_factors[segment_id] = {
                'crime': {
                    'score': np.random.uniform(0, 1),
                    'last_updated': timestamp.isoformat(),
                    'sources': ['historical_data']
                },
                'lighting': {
                    'score': np.random.uniform(0.7, 1.0),  # Assume generally well-lit
                    'last_updated': timestamp.isoformat(),
                    'sources': ['city_infrastructure']
                },
                'population': {
                    'score': np.random.uniform(0.2, 0.8),  # Varies by location
                    'last_updated': timestamp.isoformat(),
                    'sources': ['census_data']
                },
                'traffic': {
                    'score': np.random.uniform(0.1, 0.9),  # Varies by time
                    'last_updated': timestamp.isoformat(),
                    'sources': ['tomtom_traffic']
                },
                'weather': {
                    'score': np.random.uniform(0.5, 1.0),  # Assume generally good weather
                    'last_updated': timestamp.isoformat(),
                    'sources': ['openweather']
                },
                'time_of_day': {
                    'score': self._calculate_time_of_day_score(timestamp),
                    'last_updated': timestamp.isoformat(),
                    'sources': ['system_clock']
                }
            }
        
        return risk_factors
    
    def _calculate_segment_scores(
        self,
        segments: List[dict],
        risk_factors: Dict[str, dict],
        timestamp: datetime
    ) -> List[dict]:
        """
        Calculate safety scores for each segment
        """
        scored_segments = []
        
        for segment in segments:
            segment_id = segment['segment_id']
            factors = risk_factors.get(segment_id, {})
            
            # Calculate weighted score
            weighted_score = 0.0
            total_weight = 0.0
            
            for factor, weight in self.config['base_weights'].items():
                if factor in factors:
                    factor_score = factors[factor].get('score', 0.5)  # Default to neutral
                    
                    # Apply time decay to historical factors
                    if 'last_updated' in factors[factor]:
                        last_updated = datetime.fromisoformat(factors[factor]['last_updated'])
                        time_diff_hours = (timestamp - last_updated).total_seconds() / 3600
                        decay = np.exp(-time_diff_hours / self.config['time_decay_hours'])
                        factor_score = 0.5 + (factor_score - 0.5) * decay
                    
                    weighted_score += factor_score * weight
                    total_weight += weight
            
            # Normalize score
            safety_score = (weighted_score / total_weight) if total_weight > 0 else 0.5
            
            # Apply anomaly detection
            safety_score = self._detect_anomalies(segment, safety_score, segments)
            
            scored_segment = {
                **segment,
                'safety_score': safety_score,
                'risk_factors': factors,
                'anomalies': []  # Would be populated by _detect_anomalies
            }
            
            scored_segments.append(scored_segment)
        
        return scored_segments
    
    def _detect_anomalies(
        self,
        segment: dict,
        current_score: float,
        all_segments: List[dict]
    ) -> float:
        """
        Detect anomalies in segment safety scores
        """
        # Calculate z-scores for all segments
        scores = [s.get('safety_score', 0.5) for s in all_segments]
        if len(scores) > 1:
            z_scores = zscore(scores)
            segment_idx = all_segments.index(segment)
            
            if abs(z_scores[segment_idx]) > self.config['anomaly_threshold']:
                # This segment is an anomaly - adjust score
                mean_score = np.mean(scores)
                adjusted_score = mean_score + (current_score - mean_score) * 0.5  # Reduce impact
                
                # Log the anomaly
                segment['anomalies'].append({
                    'type': 'safety_score',
                    'original_score': current_score,
                    'adjusted_score': adjusted_score,
                    'z_score': float(z_scores[segment_idx]),
                    'threshold': self.config['anomaly_threshold']
                })
                
                return adjusted_score
        
        return current_score
    
    def _optimize_route(
        self,
        segments: List[dict],
        preference: float
    ) -> List[dict]:
        """
        Optimize route based on user preference between safety and speed
        """
        # In a real implementation, this would use a proper routing algorithm
        # that considers both safety and distance/duration
        
        # For now, just return the segments with combined scores
        for segment in segments:
            # Combine safety score with preference
            # Higher preference (closer to 1) favors safety over speed
            segment['combined_score'] = (
                preference * segment.get('safety_score', 0.5) +
                (1 - preference) * (1 - segment.get('normalized_duration', 0.5))
            )
        
        return segments
    
    def _calculate_route_metrics(self, segments: List[dict]) -> dict:
        """
        Calculate overall metrics for the route
        """
        total_distance = sum(s.get('length', 0) for s in segments)
        total_duration = sum(s.get('duration', 0) for s in segments)
        
        # Calculate weighted safety score
        safety_scores = []
        weights = []
        
        for segment in segments:
            length = segment.get('length', 0)
            if length > 0 and 'safety_score' in segment:
                safety_scores.append(segment['safety_score'])
                weights.append(length)
        
        avg_safety = np.average(safety_scores, weights=weights) if weights else 0.5
        
        return {
            'total_distance_meters': total_distance,
            'total_duration_seconds': total_duration,
            'average_safety_score': float(avg_safety),
            'segment_count': len(segments),
            'hazardous_segments': sum(1 for s in segments if s.get('safety_score', 1) < 0.3)
        }
    
    def _calculate_distance(self, coord1: Tuple[float, float], coord2: Tuple[float, float]) -> float:
        """
        Calculate distance between two coordinates in meters using Haversine formula
        """
        from math import radians, sin, cos, sqrt, atan2
        
        lat1, lon1 = map(radians, coord1)
        lat2, lon2 = map(radians, coord2)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * atan2(sqrt(a), sqrt(1-a))
        
        # Earth radius in meters
        return 6371000 * c
    
    def _calculate_time_of_day_score(self, timestamp: datetime) -> float:
        """
        Calculate safety score based on time of day
        Returns value between 0 (least safe) and 1 (most safe)
        """
        hour = timestamp.hour
        
        # Simple model where safety is lower at night
        if 22 <= hour or hour < 5:  # 10 PM to 5 AM
            return 0.3
        elif 5 <= hour < 7 or 20 <= hour < 22:  # 5-7 AM, 8-10 PM
            return 0.6
        else:  # 7 AM - 8 PM
            return 0.9

# Singleton instance
dwgpas = DWGPAS()
