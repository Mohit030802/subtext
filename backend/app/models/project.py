import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import String, ForeignKey, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base

if TYPE_CHECKING:
    from .client import Client
    from .document import Document
    from .obligation import Obligation


class Project(Base):
    __tablename__ = "projects"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    client_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("clients.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255))
    description: Mapped[str | None] = mapped_column(String)
    status: Mapped[str] = mapped_column(String(50), server_default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"))
    updated_at: Mapped[datetime] = mapped_column(server_default=text("NOW()"), onupdate=text("NOW()"))

    client: Mapped["Client"] = relationship(back_populates="projects")
    documents: Mapped[List["Document"]] = relationship(back_populates="project", cascade="all, delete-orphan")
    obligations: Mapped[List["Obligation"]] = relationship(back_populates="project", cascade="all, delete-orphan")
