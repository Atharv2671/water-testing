import random
from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy.orm import Session
from backend.app.schemas.incident import (
    IncidentCreateRequest,
    IncidentUpdateRequest,
    IncidentResponse,
)
from backend.app.repositories.incident_repository import incident_repository

class IncidentService:
    def create_incident(self, db: Session, data: IncidentCreateRequest) -> IncidentResponse:
        current_year = datetime.now(timezone.utc).year
        rand_num = random.randint(1000, 9999)
        ref_id = f"NZ-DW-{current_year}-{rand_num}"

        incident = incident_repository.create_incident(db, ref_id, data)
        return self._to_response(incident)

    def get_incidents(
        self,
        db: Session,
        status: Optional[str] = None,
        zone_id: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[IncidentResponse]:
        incidents = incident_repository.get_incidents(db, status=status, zone_id=zone_id, limit=limit, offset=offset)
        return [self._to_response(inc) for inc in incidents]

    def get_incident(self, db: Session, incident_id: str) -> Optional[IncidentResponse]:
        inc = incident_repository.get_incident_by_id(db, incident_id)
        if not inc:
            return None
        return self._to_response(inc)

    def update_incident(self, db: Session, incident_id: str, updates: IncidentUpdateRequest) -> Optional[IncidentResponse]:
        inc = incident_repository.get_incident_by_id(db, incident_id)
        if not inc:
            return None
        
        update_dict = {}
        if updates.status is not None:
            update_dict["status"] = updates.status
        if updates.officerNotes is not None:
            update_dict["officer_notes"] = updates.officerNotes
        if updates.boilWaterAdvised is not None:
            update_dict["boil_water_advised"] = updates.boilWaterAdvised

        updated = incident_repository.update_incident(db, inc, update_dict)
        return self._to_response(updated)

    def _to_response(self, inc) -> IncidentResponse:
        coords = [inc.latitude, inc.longitude] if inc.latitude is not None and inc.longitude is not None else None
        return IncidentResponse(
            id=inc.id,
            category=inc.category,
            categoryLabel=inc.category_label,
            severity=inc.severity,
            address=inc.address,
            coordinates=coords,
            supplyZoneId=inc.supply_zone_id,
            supplySchemeName=inc.supply_scheme_name,
            description=inc.description,
            observedAt=inc.observed_at,
            waterSupplyType=inc.water_supply_type,
            boilWaterAdvised=inc.boil_water_advised,
            reporterName=inc.reporter_name,
            reporterEmail=inc.reporter_email,
            reporterPhone=inc.reporter_phone,
            isAnonymous=inc.is_anonymous,
            status=inc.status,
            createdAt=inc.created_at.isoformat() if inc.created_at else "",
            officerNotes=inc.officer_notes,
        )

incident_service = IncidentService()
