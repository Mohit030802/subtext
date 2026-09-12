import os

files = {
    'app/core/auth.py': '''from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from sqlalchemy import text

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db)
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET, algorithms=["HS256"])
        google_id: str = payload.get("sub")
        email: str = payload.get("email")
        name: str = payload.get("name")
        picture: str = payload.get("picture")

        if google_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid auth credentials")
            
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    stmt = insert(User).values(
        google_id=google_id,
        email=email,
        name=name,
        avatar_url=picture
    ).on_conflict_do_update(
        index_elements=['google_id'],
        set_={
            'name': name,
            'avatar_url': picture,
            'updated_at': text('NOW()')
        }
    ).returning(User)
    
    result = await db.execute(stmt)
    user = result.scalar_one()
    await db.commit()
    return user
''',
    
    'app/services/__init__.py': '',
    
    'app/services/google_drive.py': '''from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials
import io
from googleapiclient.http import MediaIoBaseDownload

def get_drive_service(access_token: str):
    creds = Credentials(token=access_token)
    return build('drive', 'v3', credentials=creds)

def get_file_metadata(access_token: str, file_id: str) -> dict:
    service = get_drive_service(access_token)
    file = service.files().get(
        fileId=file_id, 
        fields="name, mimeType, size, webViewLink, thumbnailLink"
    ).execute()
    return file

def download_file_content(access_token: str, file_id: str) -> bytes:
    service = get_drive_service(access_token)
    request = service.files().get_media(fileId=file_id)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    return fh.getvalue()

def export_google_doc(access_token: str, file_id: str, mime_type: str = "application/pdf") -> bytes:
    service = get_drive_service(access_token)
    request = service.files().export_media(fileId=file_id, mimeType=mime_type)
    fh = io.BytesIO()
    downloader = MediaIoBaseDownload(fh, request)
    done = False
    while done is False:
        status, done = downloader.next_chunk()
    return fh.getvalue()
''',

    'app/api/v1/endpoints/__init__.py': '',
    
    'app/api/v1/endpoints/users.py': '''from fastapi import APIRouter, Depends
from typing import Annotated
from app.models.user import User
from app.schemas.user import UserOut
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserOut)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
'''
}

for path, content in files.items():
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
print('Auth and Users endpoints created')
