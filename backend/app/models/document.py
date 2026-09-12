import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING, Any
from sqlalchemy import String, ForeignKey, Integer, JSON, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .project import Project
    from .clause_risk import ClauseRisk
    from .obligation import Obligation
    from .chat_session import ChatSession


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    doc_type: Mapped[str] = mapped_column(String(50), server_default="OTHER")
    google_drive_file_id: Mapped[str | None] = mapped_column(String(255))
    google_drive_view_url: Mapped[str | None] = mapped_column(String(500))
    google_drive_mime_type: Mapped[str | None] = mapped_column(String(100))
    page_count: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(50), server_default="PENDING")
    risk_score: Mapped[str | None] = mapped_column(String(10))
    summary: Mapped[dict[str, Any] | None] = mapped_column(JSON)
    raw_text: Mapped[str | None] = mapped_column(String)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))
    analyzed_at: Mapped[datetime | None] = mapped_column()

    project: Mapped["Project"] = relationship(back_populates="documents")
    clause_risks: Mapped[List["ClauseRisk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    obligations: Mapped[List["Obligation"]] = relationship(back_populates="document", cascade="all, delete-orphan")
    chat_sessions: Mapped[List["ChatSession"]] = relationship(back_populates="document", cascade="all, delete-orphan")
