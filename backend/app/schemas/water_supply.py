from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from backend.app.schemas.gis import (
    AucklandSupplyZoneSchema,
    WaterSupplySchemeSchema,
    BufferTierSchema,
    WaterNetworkLineageSchema,
    NZTMCoordinate,
)

ResolutionStatus = Literal[
    "VERIFIED",
    "AMBIGUOUS",
    "NEAR_ZONE",
    "UNMAPPED_OUTSIDE_RETICULATION",
    "REVIEW_REQUIRED"
]

class WaterSupplyResolveRequest(BaseModel):
    address: Optional[str] = Field(None, description="Street address or parcel identifier")
    coordinates: Optional[List[float]] = Field(None, description="[latitude, longitude] in WGS84")
    address_id: Optional[str] = Field(None, description="Optional verified parcel ID")

class WaterSupplyResolutionResponse(BaseModel):
    status: ResolutionStatus
    queriedAddress: str
    coordinates: List[float]  # [lat, lng]
    nztm2000: NZTMCoordinate
    supplyZone: Optional[AucklandSupplyZoneSchema] = None
    supplyScheme: Optional[WaterSupplySchemeSchema] = None
    bufferTier: Optional[BufferTierSchema] = None
    lineage: Optional[WaterNetworkLineageSchema] = None
    matchedPipeCompkey: Optional[int] = None
    distanceToMainMeters: Optional[float] = None
    warnings: List[str] = []
    confidenceScore: float = 1.0
