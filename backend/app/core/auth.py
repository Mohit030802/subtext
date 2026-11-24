from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from sqlalchemy import text
from typing import Annotated

security = HTTPBearer()


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, settings.AUTH_SECRET, algorithms=["HS256"])
        google_id: str = payload.get("sub")
        email: str = payload.get("email")
        name: str = payload.get("name")
        picture: str = payload.get("picture")

        if not google_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid auth credentials — missing sub",
            )

    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {e}",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # ── UPSERT / SYNC: check by google_id or email to support linking & avoid duplicate email collision ──
    result = await db.execute(
        select(User).where((User.google_id == google_id) | (User.email == email))
    )
    user = result.scalar_one_or_none()

    if user:
        # User exists: link google_id and sync latest profile info
        user.google_id = google_id
        user.email = email
        if name:
            user.name = name
        if picture:
            user.avatar_url = picture
        await db.commit()
        await db.refresh(user)
    else:
        # Create new user
        user = User(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=picture,
        )
        db.add(user)
        try:
            await db.commit()
            await db.refresh(user)
        except Exception:
            await db.rollback()
            # Concurrent insert safety: re-query existing user
            res = await db.execute(
                select(User).where((User.google_id == google_id) | (User.email == email))
            )
            user = res.scalar_one_or_none()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create or fetch user",
                )

    return user
