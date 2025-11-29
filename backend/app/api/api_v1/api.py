from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field, validator

from ....core.security import get_current_user
from ....models.user import User
from ....algorithms.dwgpas import dwgpas

router = APIRouter()

# Request/Response Models
class Coordinate(BaseModel):
    lat: float = Field(..., ge=-90, le=90, description="Latitude")
    lng: float = Field(..., ge=-180, le=180, description="Longitude")

class RouteRequest(BaseModel):
    start: Coordinate
    end: Coordinate
    preference: float = Field(0.5, ge=0, le=1, description="0 = fastest, 1 = safest")
    departure_time: Optional[datetime] = None
    avoid_areas: Optional[List[dict]] = None
    
    @validator('preference')
    def validate_preference(cls, v):
        if not 0 <= v <= 1:
            raise ValueError('Preference must be between 0 and 1')
        return v

class ReportRequest(BaseModel):
    location: Coordinate
    report_type: str
    description: Optional[str] = None
    severity: int = Field(1, ge=1, le=5)
    image_url: Optional[str] = None

# API Endpoints
@router.post("/route/safest", response_model=dict)
async def get_safest_route(
    route_request: RouteRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Calculate the safest route between two points based on various risk factors.
    """
    try:
        start = (route_request.start.lat, route_request.start.lng)
        end = (route_request.end.lat, route_request.end.lng)
        
        result = await dwgpas.calculate_safest_route(
            start=start,
            end=end,
            preference=route_request.preference,
            departure_time=route_request.departure_time or datetime.utcnow(),
            avoid_areas=route_request.avoid_areas
        )
        
        if result['status'] == 'error':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=result.get('message', 'Failed to calculate route')
            )
            
        return {
            "status": "success",
            "data": result
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/report/add", status_code=status.HTTP_201_CREATED)
async def add_safety_report(
    report: ReportRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Add a new safety report to the system.
    """
    try:
        # In a real implementation, this would save to the database
        # and potentially trigger alerts
        return {
            "status": "success",
            "message": "Report submitted successfully",
            "report_id": "mock_report_id",
            "expires_at": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/alerts/zone-status")
async def get_zone_status(
    lat: float,
    lng: float,
    radius: float = 500,  # meters
    current_user: User = Depends(get_current_user)
):
    """
    Get safety status for a specific zone.
    Returns a safety score and status (green/yellow/red).
    """
    try:
        # In a real implementation, this would query the database
        # for recent reports and calculate a safety score
        return {
            "status": "success",
            "data": {
                "location": {"lat": lat, "lng": lng},
                "radius_meters": radius,
                "safety_score": 0.75,  # Example score
                "risk_level": "green",  # green/yellow/red
                "recent_reports": 2,    # Number of recent reports in area
                "last_updated": datetime.utcnow().isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.post("/panic", status_code=status.HTTP_200_OK)
asdef trigger_panic(
    location: Coordinate,
    current_user: User = Depends(get_current_user)
):
    """
    Trigger a panic alert, notifying emergency contacts.
    """
    try:
        # In a real implementation, this would:
        # 1. Send notifications to emergency contacts
        # 2. Potentially notify authorities
        # 3. Start location tracking
        
        return {
            "status": "success",
            "message": "Panic alert triggered",
            "alert_id": "mock_alert_id",
            "notified_contacts": ["contact1@example.com", "contact2@example.com"],
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
