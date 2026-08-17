import uuid
import enum
from datetime import datetime, date
from sqlalchemy import String, Text, Boolean, DateTime, Date, ForeignKey, Enum, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base


class ObligationType(str, enum.Enum):
    RENEWAL_NOTICE = "RENEWAL_NOTICE"
    PAYMENT = "PAYMENT"
    DELIVERABLE = "DELIVERABLE"
    EXPIRY = "EXPIRY"
    COMPLIANCE = "COMPLIANCE"
    OTHER = "OTHER"


class PartyResponsible(str, enum.Enum):
    CLIENT = "CLIENT"
    US = "US"
    THIRD_PARTY = "THIRD_PARTY"


class ObligationStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    OVERDUE = "OVERDUE"


class ContractObligation(Base):
    __tablename__ = "contract_obligations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    due_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    obligation_type: Mapped[ObligationType] = mapped_column(
        Enum(ObligationType), default=ObligationType.OTHER
    )
    party_responsible: Mapped[PartyResponsible] = mapped_column(
        Enum(PartyResponsible), default=PartyResponsible.US
    )
    is_synced_calendar: Mapped[bool] = mapped_column(Boolean, default=False)
    calendar_event_id: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[ObligationStatus] = mapped_column(
        Enum(ObligationStatus), default=ObligationStatus.PENDING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    document: Mapped["Document"] = relationship(
        "Document", back_populates="obligations"
    )

    def __repr__(self) -> str:
        return f"<Obligation {self.title} [{self.status}]>"
