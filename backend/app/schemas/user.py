import uuid
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
