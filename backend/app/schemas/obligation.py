import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class ObligationBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[date] = None
    obligation_type: Optional[str] = None
    party_responsible: Optional[str] = None
    status: Optional[str] = "PENDING"
    is_synced_calendar: bool = False
    calendar_event_id: Optional[str] = None


class ObligationOut(ObligationBase):
    id: uuid.UUID
    document_id: uuid.UUID
    project_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ObligationUpdate(BaseModel):
    status: Optional[str] = None
    is_synced_calendar: Optional[bool] = None
    calendar_event_id: Optional[str] = None
