import os

files = {
    'app/schemas/__init__.py': '''from .user import UserOut
from .client import ClientCreate, ClientUpdate, ClientOut
from .project import ProjectCreate, ProjectUpdate, ProjectOut
from .document import DocumentCreate, DocumentOut, DocumentWithAnalysis
from .clause_risk import ClauseRiskOut
from .obligation import ObligationOut, ObligationUpdate
from .chat import ChatSessionOut, ChatMessageCreate, ChatMessageOut
from .dashboard import DashboardStats, RecentDocument, UpcomingObligation
''',

    'app/schemas/user.py': '''from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    avatar_url: Optional[str] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
''',

    'app/schemas/client.py': '''from pydantic import BaseModel, ConfigDict
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
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    
    project_count: int = 0
    document_count: int = 0
    high_risk_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
''',

    'app/schemas/project.py': '''from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ProjectBase(BaseModel):
    name: str
    description: Optional[str] = None
    status: Optional[str] = "ACTIVE"

class ProjectCreate(ProjectBase):
    client_id: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class ProjectOut(ProjectBase):
    id: str
    client_id: str
    created_at: datetime
    updated_at: datetime
    
    document_count: int = 0
    
    model_config = ConfigDict(from_attributes=True)
''',

    'app/schemas/document.py': '''from pydantic import BaseModel, ConfigDict
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
    project_id: str

class DocumentOut(DocumentBase):
    id: str
    project_id: str
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
''',

    'app/schemas/clause_risk.py': '''from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional

class ClauseRiskOut(BaseModel):
    id: str
    document_id: str
    clause_text: str
    risk_level: str
    explanation: str
    suggested_redline: Optional[str] = None
    page_number: Optional[int] = None
    position_start: Optional[int] = None
    position_end: Optional[int] = None
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
''',

    'app/schemas/obligation.py': '''from pydantic import BaseModel, ConfigDict
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
    id: str
    document_id: str
    project_id: str
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)

class ObligationUpdate(BaseModel):
    status: Optional[str] = None
    is_synced_calendar: Optional[bool] = None
    calendar_event_id: Optional[str] = None
''',

    'app/schemas/chat.py': '''from pydantic import BaseModel, ConfigDict
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
''',

    'app/schemas/dashboard.py': '''from pydantic import BaseModel, ConfigDict
from datetime import datetime, date
from typing import Optional

class DashboardStats(BaseModel):
    total_documents: int
    total_clients: int
    high_risk_count: int
    upcoming_obligations_count: int

class RecentDocument(BaseModel):
    id: str
    title: str
    doc_type: str
    risk_score: Optional[str] = None
    status: str
    created_at: datetime
    project_name: str
    client_name: str
    
    model_config = ConfigDict(from_attributes=True)

class UpcomingObligation(BaseModel):
    id: str
    title: str
    due_date: Optional[date] = None
    obligation_type: Optional[str] = None
    status: str
    document_title: str
    project_name: str
    client_name: str
    
    model_config = ConfigDict(from_attributes=True)
'''
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Schemas created')
