import os

files = {
    'app/api/v1/endpoints/clients.py': '''from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from sqlalchemy import select, func, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from app.schemas.client import ClientOut, ClientCreate, ClientUpdate

router = APIRouter()

@router.get("", response_model=List[ClientOut])
async def get_clients(
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    project_count_stmt = (
        select(func.count(Project.id))
        .where(Project.client_id == Client.id)
        .scalar_subquery()
    )
    
    document_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .where(Project.client_id == Client.id)
        .scalar_subquery()
    )
    
    high_risk_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .where(Project.client_id == Client.id)
        .where(Document.risk_score == 'HIGH')
        .scalar_subquery()
    )

    stmt = select(
        Client,
        project_count_stmt.label('project_count'),
        document_count_stmt.label('document_count'),
        high_risk_count_stmt.label('high_risk_count')
    ).where(Client.user_id == current_user.id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    clients = []
    for client, p_count, d_count, h_count in rows:
        client_dict = client.__dict__.copy()
        client_dict['project_count'] = p_count or 0
        client_dict['document_count'] = d_count or 0
        client_dict['high_risk_count'] = h_count or 0
        clients.append(client_dict)
        
    return clients

@router.post("", response_model=ClientOut)
async def create_client(
    client_in: ClientCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    client = Client(**client_in.model_dump(), user_id=current_user.id)
    db.add(client)
    await db.commit()
    await db.refresh(client)
    
    client_dict = client.__dict__.copy()
    client_dict['project_count'] = 0
    client_dict['document_count'] = 0
    client_dict['high_risk_count'] = 0
    return client_dict

@router.get("/{client_id}", response_model=ClientOut)
async def get_client(
    client_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    project_count_stmt = (
        select(func.count(Project.id))
        .where(Project.client_id == Client.id)
        .scalar_subquery()
    )
    
    document_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .where(Project.client_id == Client.id)
        .scalar_subquery()
    )
    
    high_risk_count_stmt = (
        select(func.count(Document.id))
        .select_from(Document)
        .join(Project, Project.id == Document.project_id)
        .where(Project.client_id == Client.id)
        .where(Document.risk_score == 'HIGH')
        .scalar_subquery()
    )

    stmt = select(
        Client,
        project_count_stmt.label('project_count'),
        document_count_stmt.label('document_count'),
        high_risk_count_stmt.label('high_risk_count')
    ).where(Client.id == client_id, Client.user_id == current_user.id)
    
    result = await db.execute(stmt)
    row = result.first()
    
    if not row:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        
    client, p_count, d_count, h_count = row
    client_dict = client.__dict__.copy()
    client_dict['project_count'] = p_count or 0
    client_dict['document_count'] = d_count or 0
    client_dict['high_risk_count'] = h_count or 0
    return client_dict

@router.put("/{client_id}", response_model=ClientOut)
async def update_client(
    client_id: str,
    client_in: ClientUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Client).where(Client.id == client_id, Client.user_id == current_user.id)
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        
    update_data = client_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(client, key, value)
        
    await db.commit()
    
    return await get_client(client_id, current_user, db)

@router.delete("/{client_id}")
async def delete_client(
    client_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Client).where(Client.id == client_id, Client.user_id == current_user.id)
    result = await db.execute(stmt)
    client = result.scalar_one_or_none()
    
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Client not found")
        
    await db.delete(client)
    await db.commit()
    return {"ok": True}
''',

    'app/api/v1/endpoints/projects.py': '''from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from app.schemas.project import ProjectOut, ProjectCreate, ProjectUpdate

router = APIRouter()

async def verify_client_ownership(client_id: str, user_id: str, db: AsyncSession):
    stmt = select(Client).where(Client.id == client_id, Client.user_id == user_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized or client not found")

async def verify_project_ownership(project_id: str, user_id: str, db: AsyncSession) -> Project:
    stmt = select(Project).join(Client).where(Project.id == project_id, Client.user_id == user_id)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Project not found")
    return project

@router.get("/clients/{client_id}/projects", response_model=List[ProjectOut])
async def get_projects(
    client_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_client_ownership(client_id, current_user.id, db)
    
    document_count_stmt = (
        select(func.count(Document.id))
        .where(Document.project_id == Project.id)
        .scalar_subquery()
    )
    
    stmt = select(
        Project,
        document_count_stmt.label('document_count')
    ).where(Project.client_id == client_id)
    
    result = await db.execute(stmt)
    rows = result.all()
    
    projects = []
    for project, d_count in rows:
        proj_dict = project.__dict__.copy()
        proj_dict['document_count'] = d_count or 0
        projects.append(proj_dict)
        
    return projects

@router.post("/clients/{client_id}/projects", response_model=ProjectOut)
async def create_project(
    client_id: str,
    project_in: ProjectCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    if project_in.client_id != client_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Client ID mismatch")
        
    await verify_client_ownership(client_id, current_user.id, db)
    
    project = Project(**project_in.model_dump())
    db.add(project)
    await db.commit()
    await db.refresh(project)
    
    proj_dict = project.__dict__.copy()
    proj_dict['document_count'] = 0
    return proj_dict

@router.get("/projects/{project_id}", response_model=ProjectOut)
async def get_project(
    project_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    project = await verify_project_ownership(project_id, current_user.id, db)
    
    document_count_stmt = (
        select(func.count(Document.id))
        .where(Document.project_id == project_id)
        .scalar_subquery()
    )
    
    stmt = select(
        Project,
        document_count_stmt.label('document_count')
    ).where(Project.id == project_id)
    
    result = await db.execute(stmt)
    proj, d_count = result.first()
    
    proj_dict = proj.__dict__.copy()
    proj_dict['document_count'] = d_count or 0
    return proj_dict

@router.put("/projects/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: str,
    project_in: ProjectUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    project = await verify_project_ownership(project_id, current_user.id, db)
    
    update_data = project_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(project, key, value)
        
    await db.commit()
    return await get_project(project_id, current_user, db)

@router.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    project = await verify_project_ownership(project_id, current_user.id, db)
    await db.delete(project)
    await db.commit()
    return {"ok": True}
''',

    'app/api/v1/endpoints/documents.py': '''from fastapi import APIRouter, Depends, HTTPException, status
from typing import Annotated, List
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.client import Client
from app.models.project import Project
from app.models.document import Document
from app.models.clause_risk import ClauseRisk
from app.models.obligation import Obligation
from app.schemas.document import DocumentOut, DocumentCreate, DocumentWithAnalysis
from app.schemas.clause_risk import ClauseRiskOut
from app.schemas.obligation import ObligationOut, ObligationUpdate

router = APIRouter()

async def verify_project_ownership(project_id: str, user_id: str, db: AsyncSession):
    stmt = select(Project).join(Client).where(Project.id == project_id, Client.user_id == user_id)
    result = await db.execute(stmt)
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized or project not found")

async def verify_document_ownership(document_id: str, user_id: str, db: AsyncSession) -> Document:
    stmt = select(Document).join(Project).join(Client).where(Document.id == document_id, Client.user_id == user_id)
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
    return document

@router.get("/projects/{project_id}/documents", response_model=List[DocumentOut])
async def get_documents(
    project_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_project_ownership(project_id, current_user.id, db)
    
    stmt = select(Document).where(Document.project_id == project_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/documents", response_model=DocumentOut)
async def create_document(
    project_id: str,
    doc_in: DocumentCreate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    if doc_in.project_id != project_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Project ID mismatch")
        
    await verify_project_ownership(project_id, current_user.id, db)
    
    document = Document(**doc_in.model_dump())
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return document

@router.get("/documents/{document_id}", response_model=DocumentWithAnalysis)
async def get_document(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Document).options(
        selectinload(Document.clause_risks),
        selectinload(Document.obligations)
    ).join(Project).join(Client).where(Document.id == document_id, Client.user_id == current_user.id)
    
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    return document

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    document = await verify_document_ownership(document_id, current_user.id, db)
    await db.delete(document)
    await db.commit()
    return {"ok": True}

@router.get("/documents/{document_id}/risks", response_model=List[ClauseRiskOut])
async def get_document_risks(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_document_ownership(document_id, current_user.id, db)
    stmt = select(ClauseRisk).where(ClauseRisk.document_id == document_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.get("/documents/{document_id}/obligations", response_model=List[ObligationOut])
async def get_document_obligations(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_document_ownership(document_id, current_user.id, db)
    stmt = select(Obligation).where(Obligation.document_id == document_id)
    result = await db.execute(stmt)
    return result.scalars().all()

@router.put("/documents/{document_id}/obligations/{obligation_id}", response_model=ObligationOut)
async def update_obligation(
    document_id: str,
    obligation_id: str,
    obl_in: ObligationUpdate,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_document_ownership(document_id, current_user.id, db)
    
    stmt = select(Obligation).where(Obligation.id == obligation_id, Obligation.document_id == document_id)
    result = await db.execute(stmt)
    obligation = result.scalar_one_or_none()
    
    if not obligation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Obligation not found")
        
    update_data = obl_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(obligation, key, value)
        
    await db.commit()
    await db.refresh(obligation)
    return obligation
''',

    'app/api/v1/endpoints/dashboard.py': '''from fastapi import APIRouter, Depends
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
        select(Document, Project.name.label('project_name'), Client.name.label('client_name'))
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
    for doc, proj_name, cli_name in rows:
        d = doc.__dict__.copy()
        d['project_name'] = proj_name
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
        select(Obligation, Document.title.label('document_title'), Project.name.label('project_name'), Client.name.label('client_name'))
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
    for obl, doc_title, proj_name, cli_name in rows:
        o = obl.__dict__.copy()
        o['document_title'] = doc_title
        o['project_name'] = proj_name
        o['client_name'] = cli_name
        obls.append(o)
    return obls
''',

    'app/api/v1/router.py': '''from fastapi import APIRouter
from .endpoints import users, clients, projects, documents, dashboard

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
'''
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Endpoints created')
