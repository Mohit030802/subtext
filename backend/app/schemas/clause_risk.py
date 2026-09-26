import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ClauseRiskOut(BaseModel):
    id: uuid.UUID
    document_id: uuid.UUID
    clause_text: str
    risk_level: str
    explanation: str
    suggested_redline: Optional[str] = None
    page_number: Optional[int] = None
    position_start: Optional[int] = None
    position_end: Optional[int] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
