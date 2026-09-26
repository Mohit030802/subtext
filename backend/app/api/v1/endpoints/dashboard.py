from fastapi import APIRouter, Depends
from typing import Annotated, List
from sqlalchemy import select, func, desc, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timedelta, timezone
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from app.models.obligation import Obligation
from app.schemas.dashboard import DashboardStats, RecentDocument, UpcomingObligation

router = APIRouter()

@router.get("/stats", response_model=DashboardStats)
async def get_dashboard_stats(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    client_count_stmt = select(func.count(Client.id)).where(Client.user_id == current_user.id)
    client_count = (await db.execute(client_count_stmt)).scalar() or 0

    doc_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
    )
    doc_count = (await db.execute(doc_count_stmt)).scalar() or 0

    high_risk_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .where(Document.risk_score == 'HIGH')
    )
    high_risk_count = (await db.execute(high_risk_count_stmt)).scalar() or 0

    thirty_days_from_now = datetime.now(timezone.utc).date() + timedelta(days=30)
    today = datetime.now(timezone.utc).date()
    
    obl_count_stmt = (
        select(func.count(Obligation.id))
        .select_from(Obligation)
        .join(Document, Document.id == Obligation.document_id)
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .where(Obligation.status == 'PENDING')
        .where(Obligation.due_date <= thirty_days_from_now)
        .where(Obligation.due_date >= today)
    )
    obl_count = (await db.execute(obl_count_stmt)).scalar() or 0

    return DashboardStats(
        total_documents=doc_count,
        total_clients=client_count,
        high_risk_count=high_risk_count,
        upcoming_obligations_count=obl_count
    )

@router.get("/recent", response_model=List[RecentDocument])
async def get_recent_documents(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(
            Document,
            Project.id.label('project_id'),
            Project.name.label('project_name'),
            Client.id.label('client_id'),
            Client.name.label('client_name'),
        )
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .order_by(desc(Document.created_at))
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    docs = []
    for doc, proj_id, proj_name, cli_id, cli_name in rows:
        d = doc.__dict__.copy()
        d['project_id'] = proj_id
        d['project_name'] = proj_name
        d['client_id'] = cli_id
        d['client_name'] = cli_name
        docs.append(d)
    return docs

@router.get("/obligations", response_model=List[UpcomingObligation])
async def get_upcoming_obligations(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    today = datetime.now(timezone.utc).date()
    
    stmt = (
        select(
            Obligation,
            Document.id.label('document_id'),
            Document.title.label('document_title'),
            Project.id.label('project_id'),
            Project.name.label('project_name'),
            Client.id.label('client_id'),
            Client.name.label('client_name'),
        )
        .select_from(Obligation)
        .join(Document, Document.id == Obligation.document_id)
        .join(Project, Project.id == Document.project_id)
        .join(Client, Client.id == Project.client_id)
        .where(Client.user_id == current_user.id)
        .where(Obligation.status == 'PENDING')
        .where(Obligation.due_date >= today)
        .order_by(Obligation.due_date.asc())
        .limit(10)
    )
    result = await db.execute(stmt)
    rows = result.all()
    
    obls = []
    for obl, doc_id, doc_title, proj_id, proj_name, cli_id, cli_name in rows:
        o = obl.__dict__.copy()
        o['document_id'] = doc_id
        o['document_title'] = doc_title
        o['project_id'] = proj_id
        o['project_name'] = proj_name
        o['client_id'] = cli_id
        o['client_name'] = cli_name
        obls.append(o)
    return obls
