import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional


class DashboardStats(BaseModel):
    total_documents: int
    total_clients: int
    high_risk_count: int
    upcoming_obligations_count: int


class RecentDocument(BaseModel):
    id: uuid.UUID
    title: str
    doc_type: str
    risk_score: Optional[str] = None
    status: str
    created_at: datetime
    project_name: str
    client_name: str

    model_config = ConfigDict(from_attributes=True)


class UpcomingObligation(BaseModel):
    id: uuid.UUID
    title: str
    due_date: Optional[date] = None
    obligation_type: Optional[str] = None
    status: str
    document_title: str
    project_name: str
    client_name: str

    model_config = ConfigDict(from_attributes=True)
