from fastapi import APIRouter, Depends
from typing import Annotated
from app.models.user import User
from app.schemas.user import UserOut
from app.core.auth import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserOut)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user
