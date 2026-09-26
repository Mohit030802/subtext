from fastapi import APIRouter, Depends, Query
from typing import Annotated, List, Optional
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from pydantic import BaseModel, ConfigDict
import uuid

router = APIRouter()


class SearchClient(BaseModel):
    id: uuid.UUID
    name: str
    industry: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SearchProject(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    name: str
    model_config = ConfigDict(from_attributes=True)


class SearchDocument(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    client_id: uuid.UUID
    client_name: str
    project_name: str
    title: str
    doc_type: Optional[str] = None
    risk_score: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)


class SearchResults(BaseModel):
    clients: List[SearchClient]
    projects: List[SearchProject]
    documents: List[SearchDocument]


@router.get("/search", response_model=SearchResults)
async def search(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    q: str = Query("", min_length=0),
):
    q = q.strip()
    if not q:
        return SearchResults(clients=[], projects=[], documents=[])

    pattern = f"%{q}%"

    # Search clients
    client_stmt = (
        select(Client)
        .where(Client.user_id == current_user.id)
        .where(Client.name.ilike(pattern))
        .limit(5)
    )
    client_rows = (await db.execute(client_stmt)).scalars().all()
    clients = [SearchClient(id=c.id, name=c.name, industry=c.industry) for c in client_rows]

    # Search projects
    proj_stmt = (
        select(Project, Client.id.label("client_id"), Client.name.label("client_name"))
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .where(Project.name.ilike(pattern))
        .limit(5)
    )
    proj_rows = (await db.execute(proj_stmt)).all()
    projects = [
        SearchProject(id=p.id, client_id=cli_id, client_name=cli_name, name=p.name)
        for p, cli_id, cli_name in proj_rows
    ]

    # Search documents (by title or raw_text snippet)
    doc_stmt = (
        select(
            Document,
            Project.id.label("project_id"),
            Client.id.label("client_id"),
            Client.name.label("client_name"),
            Project.name.label("project_name"),
        )
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .where(Document.title.ilike(pattern))
        .limit(8)
    )
    doc_rows = (await db.execute(doc_stmt)).all()
    documents = [
        SearchDocument(
            id=doc.id,
            project_id=proj_id,
            client_id=cli_id,
            client_name=cli_name,
            project_name=proj_name,
            title=doc.title,
            doc_type=doc.doc_type,
            risk_score=doc.risk_score,
        )
        for doc, proj_id, cli_id, cli_name, proj_name in doc_rows
    ]

    return SearchResults(clients=clients, projects=projects, documents=documents)
