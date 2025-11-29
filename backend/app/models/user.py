from sqlalchemy import Column, String, Boolean, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import expression
import uuid

from .base import BaseMixin
from ..core.database import Base

class User(Base, BaseMixin):
    """User model for authentication and user data"""
    
    __tablename__ = "users"
    
    firebase_uid = Column(String(128), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    phone_number = Column(String(20), nullable=True)
    full_name = Column(String(100), nullable=True)
    profile_picture = Column(String(255), nullable=True)
    is_active = Column(Boolean, server_default=expression.true(), nullable=False)
    is_verified = Column(Boolean, server_default=expression.false(), nullable=False)
    preferences = Column(JSON, nullable=True, server_default='{}')
    
    # Emergency contacts
    emergency_contacts = Column(JSON, nullable=True, server_default='[]')
    
    def __repr__(self):
        return f"<User {self.email}>"
    
    @property
    def is_authenticated(self):
        return self.is_active
    
    def to_dict(self):
        data = super().to_dict()
        # Remove sensitive data
        data.pop('firebase_uid', None)
        return data
