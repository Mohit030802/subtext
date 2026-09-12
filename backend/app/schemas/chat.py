from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional, Any

class ChatSessionOut(BaseModel):
    id: str
    document_id: str
    title: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ChatMessageCreate(BaseModel):
    content: str
    role: str = "user"

class ChatMessageOut(BaseModel):
    id: str
    session_id: str
    role: str
    content: str
    citations: Optional[dict[str, Any]] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
