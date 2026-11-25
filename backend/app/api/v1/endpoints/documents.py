from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status, Header, Response
from pydantic import BaseModel
from typing import Annotated, List
import uuid
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
from app.services.document_processor import process_document_background

router = APIRouter()

ALLOWED_DOC_TYPES = {"NDA", "MSA", "SOW", "SLA", "HIRING", "OTHER"}
DOC_TYPE_ALIASES = {
    "EMPLOYMENT": "HIRING",
    "CONTRACTOR": "HIRING",
    "OFFER": "HIRING",
}


def normalize_doc_type(doc_type: str | None, fallback: str = "OTHER") -> str:
    if not doc_type:
        return fallback
    normalized = doc_type.strip().upper()
    normalized = DOC_TYPE_ALIASES.get(normalized, normalized)
    return normalized if normalized in ALLOWED_DOC_TYPES else fallback

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
    
    stmt = select(Document).where(Document.project_id == project_id, Document.is_latest.is_(True))
    result = await db.execute(stmt)
    return result.scalars().all()

@router.post("/projects/{project_id}/documents", response_model=DocumentOut)
async def create_document(
    project_id: str,
    doc_in: DocumentCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    await verify_project_ownership(project_id, current_user.id, db)

    document_id = uuid.uuid4()
    document = Document(
        id=document_id,
        project_id=project_id,
        document_family_id=document_id,
        version_number=1,
        is_latest=True,
        title=doc_in.title,
        doc_type=normalize_doc_type(doc_in.doc_type),
        google_drive_file_id=doc_in.google_drive_file_id,
        google_drive_view_url=doc_in.google_drive_view_url,
        google_drive_mime_type=doc_in.google_drive_mime_type,
        page_count=doc_in.page_count,
        status="PENDING",
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    # Trigger background processing if we have a Drive token
    # The API returns immediately; processing happens after the response is sent
    if doc_in.drive_access_token:
        background_tasks.add_task(
            process_document_background,
            str(document.id),
            doc_in.drive_access_token,
        )

    return document

@router.get("/documents/{document_id}", response_model=DocumentWithAnalysis)
async def get_document(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    version: int | None = Query(default=None, ge=1),
):
    requested = await verify_document_ownership(document_id, current_user.id, db)
    filters = [Document.document_family_id == requested.document_family_id]
    if version is None:
        filters.append(Document.is_latest.is_(True))
    else:
        filters.append(Document.version_number == version)

    stmt = select(Document).options(
        selectinload(Document.clause_risks),
        selectinload(Document.obligations)
    ).join(Project).join(Client).where(*filters, Client.user_id == current_user.id)
    
    result = await db.execute(stmt)
    document = result.scalar_one_or_none()
    
    if not document:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found")
        
    return document


@router.get("/documents/{document_id}/pdf")
async def get_document_pdf(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
    drive_token: str | None = Header(default=None, alias="X-Drive-Token"),
):
    requested = await verify_document_ownership(document_id, current_user.id, db)
    if not requested.google_drive_file_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No Google Drive file linked to this document")
    if not drive_token:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Missing X-Drive-Token header")
    
    import httpx
    headers = {"Authorization": f"Bearer {drive_token}"}
    file_id = str(requested.google_drive_file_id)
    mime_type = requested.google_drive_mime_type or ""
    is_doc = "google-apps" in mime_type

    media_url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media&supportsAllDrives=true"
    export_url = f"https://www.googleapis.com/drive/v3/files/{file_id}/export?mimeType=application/pdf&supportsAllDrives=true"
    primary = export_url if is_doc else media_url
    secondary = media_url if is_doc else export_url

    async with httpx.AsyncClient(timeout=45) as client:
        r = await client.get(primary, headers=headers)
        if r.status_code in (400, 404):
            alt_r = await client.get(secondary, headers=headers)
            if alt_r.status_code == 200:
                r = alt_r
        if r.status_code != 200:
            raise HTTPException(status_code=r.status_code, detail=f"Google Drive returned {r.status_code}: {r.text[:200]}")
        content = r.content
    return Response(
        content=content,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{requested.title}.pdf"'}
    )


@router.get("/documents/{document_id}/versions", response_model=List[DocumentOut])
async def get_document_versions(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    requested = await verify_document_ownership(document_id, current_user.id, db)
    stmt = select(Document).where(
        Document.document_family_id == requested.document_family_id
    ).order_by(Document.version_number.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/documents/{document_id}/versions", response_model=DocumentOut)
async def create_document_version(
    document_id: str,
    doc_in: DocumentCreate,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db),
):
    requested = await verify_document_ownership(document_id, current_user.id, db)
    latest_result = await db.execute(
        select(Document).where(
            Document.document_family_id == requested.document_family_id,
            Document.is_latest.is_(True),
        ).with_for_update()
    )
    latest = latest_result.scalar_one()

    new_version = Document(
        id=uuid.uuid4(),
        project_id=latest.project_id,
        document_family_id=latest.document_family_id,
        version_number=latest.version_number + 1,
        is_latest=True,
        previous_version_id=latest.id,
        title=doc_in.title or latest.title,
        doc_type=normalize_doc_type(doc_in.doc_type, fallback=latest.doc_type),
        google_drive_file_id=doc_in.google_drive_file_id,
        google_drive_view_url=doc_in.google_drive_view_url,
        google_drive_mime_type=doc_in.google_drive_mime_type,
        page_count=doc_in.page_count,
        status="PENDING",
    )
    latest.is_latest = False
    db.add(new_version)
    await db.commit()
    await db.refresh(new_version)

    if doc_in.drive_access_token:
        background_tasks.add_task(process_document_background, str(new_version.id), doc_in.drive_access_token)

    return new_version

@router.delete("/documents/{document_id}")
async def delete_document(
    document_id: str,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    document = await verify_document_ownership(document_id, current_user.id, db)
    await db.execute(
        delete(Document).where(Document.document_family_id == document.document_family_id)
    )
    await db.commit()
    return {"ok": True}


class ProcessTrigger(BaseModel):
    drive_access_token: str


@router.post("/documents/{document_id}/process")
async def trigger_processing(
    document_id: str,
    payload: ProcessTrigger,
    background_tasks: BackgroundTasks,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    """Trigger (or re-trigger) document processing. Returns immediately; work happens in background."""
    document = await verify_document_ownership(document_id, current_user.id, db)

    if document.status == "PROCESSING":
        return {"message": "Already processing", "status": "PROCESSING"}

    # Mark as processing so the UI can show a spinner
    document.status = "PROCESSING"
    await db.commit()

    background_tasks.add_task(
        process_document_background,
        str(document.id),
        payload.drive_access_token,
    )
    return {"message": "Processing started", "status": "PROCESSING"}

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
