from fastapi import APIRouter, Depends
from typing import Annotated, List
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from pydantic import BaseModel, ConfigDict
import uuid

router = APIRouter()


class NavDocument(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    title: str
    risk_score: str | None = None


class NavProject(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    documents: List[NavDocument] = []


class NavClient(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    projects: List[NavProject] = []


@router.get("/nav-tree", response_model=List[NavClient])
async def get_nav_tree(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    """
    Lightweight nav tree: clients → projects → documents (title + risk only).
    Used by the sidebar. Returns max 5 docs per project to keep it fast.
    """
    stmt = (
        select(Client)
        .where(Client.user_id == current_user.id)
        .options(
            selectinload(Client.projects).selectinload(Project.documents)
        )
        .order_by(Client.name)
    )
    result = await db.execute(stmt)
    clients = result.scalars().all()

    nav = []
    for client in clients:
        nav_projects = []
        for project in client.projects:
            # Only include the 5 most recent docs per project in the sidebar
            recent_docs = sorted(
                project.documents,
                key=lambda d: d.created_at,
                reverse=True
            )[:5]
            nav_projects.append(NavProject(
                id=project.id,
                name=project.name,
                documents=[
                    NavDocument(id=d.id, title=d.title, risk_score=d.risk_score)
                    for d in recent_docs
                ]
            ))
        nav.append(NavClient(id=client.id, name=client.name, projects=nav_projects))

    return nav
