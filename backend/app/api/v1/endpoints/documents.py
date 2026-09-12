from fastapi import APIRouter, Depends, HTTPException, status
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
    await verify_project_ownership(project_id, current_user.id, db)

    document = Document(
        project_id=project_id,
        title=doc_in.title,
        doc_type=doc_in.doc_type or "OTHER",
        google_drive_file_id=doc_in.google_drive_file_id,
        google_drive_view_url=doc_in.google_drive_view_url,
        google_drive_mime_type=doc_in.google_drive_mime_type,
        page_count=doc_in.page_count,
    )
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
