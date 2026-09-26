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

    # ── UPSERT: create user on first login, update name/avatar on subsequent logins ──
    upsert_stmt = (
        insert(User)
        .values(
            google_id=google_id,
            email=email,
            name=name,
            avatar_url=picture,
        )
        .on_conflict_do_update(
            index_elements=["google_id"],
            set_={
                "name": name,
                "avatar_url": picture,
                "updated_at": text("NOW()"),
            },
        )
    )
    await db.execute(upsert_stmt)
    await db.commit()

    # ── Fetch the fully-mapped ORM User object after upsert ──
    result = await db.execute(select(User).where(User.google_id == google_id))
    user = result.scalar_one_or_none()

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create or fetch user",
        )

    return user
