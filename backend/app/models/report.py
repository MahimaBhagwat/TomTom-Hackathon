from sqlalchemy import Column, Integer, Float, String, ForeignKey, JSON, Text, Enum
from sqlalchemy.orm import relationship
import enum
from datetime import datetime
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
import json

from .base import BaseMixin
from ..core.database import Base

class RoutePreference(enum.Enum):
    SAFEST = "safest"
    BALANCED = "balanced"
    FASTEST = "fastest"

class RouteStatus(enum.Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Route(Base, BaseMixin):
    """Model for storing route information"""
    
    __tablename__ = "routes"
    
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Route metadata
    name = Column(String(100), nullable=True)
    status = Column(Enum(RouteStatus), default=RouteStatus.PLANNED)
    preference = Column(Enum(RoutePreference), default=RoutePreference.BALANCED)
    
    # Route geometry (GeoJSON LineString)
    geometry = Column(Geometry(geometry_type='LINESTRING', srid=4326), nullable=False)
    
    # Start and end points (for faster queries)
    start_point = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    end_point = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    
    # Route metrics
    distance_meters = Column(Float, nullable=False)  # in meters
    duration_seconds = Column(Float, nullable=False)  # in seconds
    safety_score = Column(Float, nullable=True)  # 0-100 scale
    
    # Additional metadata
    waypoints = Column(JSON, nullable=True)  # Intermediate waypoints
    avoid_areas = Column(JSON, nullable=True)  # Areas to avoid
    
    # Timestamps for tracking
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="routes")
    segments = relationship("RouteSegment", back_populates="route", cascade="all, delete-orphan")
    
    def to_geojson(self):
        """Convert route to GeoJSON Feature"""
        coords = []
        if self.geometry:
            shape = to_shape(self.geometry)
            coords = [[x, y] for x, y in shape.coords]
        
        return {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {
                "id": self.id,
                "name": self.name,
                "status": self.status.value,
                "preference": self.preference.value,
                "distance_meters": self.distance_meters,
                "duration_seconds": self.duration_seconds,
                "safety_score": self.safety_score,
                "created_at": self.created_at.isoformat(),
                "updated_at": self.updated_at.isoformat()
            }
        }

class RouteSegment(Base, BaseMixin):
    """Model for storing segments of a route with safety scores"""
    
    __tablename__ = "route_segments"
    
    route_id = Column(Integer, ForeignKey("routes.id", ondelete="CASCADE"), nullable=False)
    segment_index = Column(Integer, nullable=False)  # Order of segment in route
    
    # Geometry of this segment (GeoJSON LineString)
    geometry = Column(Geometry(geometry_type='LINESTRING', srid=4326), nullable=False)
    
    # Segment metrics
    distance_meters = Column(Float, nullable=False)
    duration_seconds = Column(Float, nullable=False)
    
    # Safety metrics
    safety_score = Column(Float, nullable=True)  # 0-100 scale
    risk_factors = Column(JSON, nullable=True)  # Dictionary of risk factors and their scores
    
    # External data references
    road_ids = Column(JSON, nullable=True)  # IDs of OSM/TomTom road segments
    
    # Relationships
    route = relationship("Route", back_populates="segments")
    
    def to_geojson(self):
        """Convert segment to GeoJSON Feature"""
        coords = []
        if self.geometry:
            shape = to_shape(self.geometry)
            coords = [[x, y] for x, y in shape.coords]
        
        return {
            "type": "Feature",
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "properties": {
                "id": self.id,
                "route_id": self.route_id,
                "segment_index": self.segment_index,
                "distance_meters": self.distance_meters,
                "duration_seconds": self.duration_seconds,
                "safety_score": self.safety_score,
                "risk_factors": self.risk_factors or {}
            }
        }

# Add relationship to User model
from .user import User
User.routes = relationship("Route", back_populates="user", cascade="all, delete-orphan")