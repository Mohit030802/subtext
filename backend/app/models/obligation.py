import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Date, Boolean, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .document import Document
    from .project import Project


class Obligation(Base):
    __tablename__ = "obligations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), index=True)
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[str | None] = mapped_column(String)
    due_date: Mapped[date | None] = mapped_column(Date)
    obligation_type: Mapped[str | None] = mapped_column(String(50))
    party_responsible: Mapped[str | None] = mapped_column(String(50))
    status: Mapped[str] = mapped_column(String(20), server_default="PENDING")
    is_synced_calendar: Mapped[bool] = mapped_column(Boolean, server_default=text("false"))
    calendar_event_id: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    document: Mapped["Document"] = relationship(back_populates="obligations")
    project: Mapped["Project"] = relationship(back_populates="obligations")
