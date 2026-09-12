import uuid
from datetime import datetime, date
from typing import TYPE_CHECKING
from sqlalchemy import String, ForeignKey, Date, Boolean, Integer, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .document import Document
    from .project import Project


class ClauseRisk(Base):
    __tablename__ = "clause_risks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    document_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), index=True)
    clause_text: Mapped[str] = mapped_column(String)
    risk_level: Mapped[str] = mapped_column(String(10))
    explanation: Mapped[str] = mapped_column(String)
    suggested_redline: Mapped[str | None] = mapped_column(String)
    page_number: Mapped[int | None] = mapped_column(Integer)
    position_start: Mapped[int | None] = mapped_column(Integer)
    position_end: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))

    document: Mapped["Document"] = relationship(back_populates="clause_risks")
