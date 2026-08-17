import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Text, Boolean, DateTime, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSON
from app.core.database import Base


class RiskScore(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    doc_type: Mapped[str] = mapped_column(
        String(50), nullable=False, default="OTHER"
    )  # NDA, SOW, MSA, Hiring, SLA, OTHER
    file_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_ocr_processed: Mapped[bool] = mapped_column(Boolean, default=False)
    risk_score: Mapped[RiskScore | None] = mapped_column(
        Enum(RiskScore), nullable=True
    )
    summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    page_count: Mapped[int | None] = mapped_column(nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    project: Mapped["Project"] = relationship("Project", back_populates="documents")
    obligations: Mapped[list["ContractObligation"]] = relationship(
        "ContractObligation", back_populates="document", cascade="all, delete-orphan"
    )
    clause_risks: Mapped[list["ClauseRisk"]] = relationship(
        "ClauseRisk", back_populates="document", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Document {self.title}>"
