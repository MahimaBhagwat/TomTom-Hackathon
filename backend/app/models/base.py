from sqlalchemy import Column, Integer, DateTime, func
from sqlalchemy.ext.declarative import declared_attr
from datetime import datetime

class BaseMixin:
    """Base mixin for all models"""
    
    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    @declared_attr
    def __tablename__(cls):
        return cls.__name__.lower()
    
    def to_dict(self):
        """Convert model to dictionary"""
        return {
            c.name: getattr(self, c.name).isoformat() 
            if isinstance(getattr(self, c.name), datetime) 
            else getattr(self, c.name)
            for c in self.__table__.columns
        }
