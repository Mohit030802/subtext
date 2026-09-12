import os

files = {
    'app/models/__init__.py': '''from .user import User
from .client import Client
from .project import Project
from .document import Document
from .clause_risk import ClauseRisk
from .obligation import Obligation
from .chat_session import ChatSession
from .chat_message import ChatMessage
''',

    'app/models/user.py': '''from datetime import datetime
from sqlalchemy import String, text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    email: Mapped[str] = mapped_column(String, unique=True, index=True)
    name: Mapped[str] = mapped_column(String)
    google_id: Mapped[str] = mapped_column(String, unique=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))
''',

    'app/models/client.py': '''from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .user import User
    from .project import Project

class Client(Base):
    __tablename__ = "clients"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String)
    industry: Mapped[str | None] = mapped_column(String)
    contact_name: Mapped[str | None] = mapped_column(String)
    contact_email: Mapped[str | None] = mapped_column(String)
    notes: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    user: Mapped["User"] = relationship()
    projects: Mapped[List["Project"]] = relationship(back_populates="client", cascade="all, delete-orphan")
''',

    'app/models/project.py': '''from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .client import Client
    from .document import Document
    from .obligation import Obligation

class Project(Base):
    __tablename__ = "projects"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    client_id: Mapped[str] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    client: Mapped["Client"] = relationship(back_populates="projects")
    documents: Mapped[List["Document"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    obligations: Mapped[List["Obligation"]] = relationship(back_populates="project", cascade="all, delete-orphan")
''',

    'app/models/document.py': '''from datetime import datetime
from typing import List, TYPE_CHECKING, Any
from sqlalchemy import String, ForeignKey, Integer, JSON, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .project import Project
    from .clause_risk import ClauseRisk
    from .obligation import Obligation
    from .chat_session import ChatSession

class Document(Base):
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String)
    doc_type: Mapped[str] = mapped_column(String, server_default="OTHER")
    google_drive_file_id: Mapped[str | None] = mapped_column(String)
    google_drive_view_url: Mapped[str | None] = mapped_column(String)
    google_drive_mime_type: Mapped[str | None] = mapped_column(String)
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String, server_default="PENDING")
    risk_score: Mapped[str | None] = mapped_column(String)
    summary: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    raw_text: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))
    analyzed_at: Mapped[datetime | None] = mapped_column()

    project: Mapped["Project"] = relationship(back_populates="documents")
    clause_risks: Mapped[List["ClauseRisk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    obligations: Mapped[List["Obligation"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship(back_populates="document", cascade="all, delete-orphan")
''',

    'app/models/clause_risk.py': '''from datetime import datetime
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Integer, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .document import Document

class ClauseRisk(Base):
    __tablename__ = "clause_risks"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    clause_text: Mapped[str] = mapped_column(String)
    risk_level: Mapped[str] = mapped_column(String)
    explanation: Mapped[str] = mapped_column(String)
    suggested_redline: Mapped[str | None] = mapped_column(String)
    page_number: Mapped[int | None] = mapped_column(Integer)
    position_start: Mapped[int | None] = mapped_column(Integer)
    position_end: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))

    document: Mapped["Document"] = relationship(back_populates="clause_risks")
''',

    'app/models/obligation.py': '''from datetime import datetime, date
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Date, Boolean, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .document import Document
    from .project import Project

class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[str] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String)
    description: Mapped[str | None] = mapped_column(String)
    due_date: Mapped[date | None] = mapped_column(Date)
    obligation_type: Mapped[str | None] = mapped_column(String)
    party_responsible: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String, server_default="PENDING")
    is_synced_calendar: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    calendar_event_id: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    document: Mapped["Document"] = relationship(back_populates="obligations")
    project: Mapped["Project"] = relationship(back_populates="obligations")
''',

    'app/models/chat_session.py': '''from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .document import Document
    from .chat_message import ChatMessage

class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    document_id: Mapped[str] = mapped_column(ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    title: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    document: Mapped["Document"] = relationship(back_populates="chat_sessions")
    messages: Mapped[List["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")
''',

    'app/models/chat_message.py': '''from datetime import datetime
from typing import TYPE_CHECKING, Any
from sqlalchemy import String, ForeignKey, JSON, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .chat_session import ChatSession

class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[str] = mapped_column(primary_key=True, server_default=text('gen_random_uuid()'))
    session_id: Mapped[str] = mapped_column(ForeignKey("chat_sessions.id", ondelete="CASCADE"), index=True)
    role: Mapped[str] = mapped_column(String)
    content: Mapped[str] = mapped_column(String)
    citations: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
'''
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Models created')
