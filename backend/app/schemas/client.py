import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ClientBase(BaseModel):
    name: str
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None


class ClientCreate(ClientBase):
    pass


class ClientUpdate(BaseModel):
    name: Optional[str] = None
    industry: Optional[str] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    notes: Optional[str] = None


class ClientOut(ClientBase):
    id: uuid.UUID
    user_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    project_count: int = 0
    document_count: int = 0
    high_risk_count: int = 0

    model_config = ConfigDict(from_attributes=True)
