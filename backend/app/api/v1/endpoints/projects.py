from fastapi import APIRouter, Depends, HTTPException, status
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
    await verify_client_ownership(client_id, current_user.id, db)

    project = Project(
        client_id=client_id,
        name=project_in.name,
        description=project_in.description,
        status=project_in.status or "ACTIVE",
    )
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
