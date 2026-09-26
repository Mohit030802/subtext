from fastapi import APIRouter, Depends, HTTPException, status
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
