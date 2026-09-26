import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any, List, TYPE_CHECKING

from app.schemas.clause_risk import ClauseRiskOut
from app.schemas.obligation import ObligationOut


class DocumentBase(BaseModel):
    title: str
    doc_type: Optional[str] = "OTHER"
    google_drive_file_id: Optional[str] = None
    google_drive_view_url: Optional[str] = None
    google_drive_mime_type: Optional[str] = None
    page_count: Optional[int] = None


class DocumentCreate(DocumentBase):
    # project_id comes from the URL path, not the request body
    # drive_access_token is the GIS token from the browser — used to download the file
    drive_access_token: Optional[str] = None


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
    # Use concrete types so Pydantic v2 can serialize ORM objects via from_attributes
    clause_risks: List[ClauseRiskOut] = []
    obligations: List[ObligationOut] = []
