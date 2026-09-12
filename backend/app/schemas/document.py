import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any, List


class DocumentBase(BaseModel):
    title: str
    doc_type: Optional[str] = "OTHER"
    google_drive_file_id: Optional[str] = None
    google_drive_view_url: Optional[str] = None
    google_drive_mime_type: Optional[str] = None
    page_count: Optional[int] = None


class DocumentCreate(DocumentBase):
    # project_id comes from the URL path, not the request body
    pass


class DocumentOut(DocumentBase):
    id: uuid.UUID
    project_id: uuid.UUID
    status: str
    risk_score: Optional[str] = None
    summary: Optional[dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime
    analyzed_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class DocumentWithAnalysis(DocumentOut):
    clause_risks: List[Any] = []
    obligations: List[Any] = []
