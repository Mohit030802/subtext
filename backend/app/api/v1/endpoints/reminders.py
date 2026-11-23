import hmac
from typing import Annotated

from fastapi import APIRouter, Header, HTTPException, status

from app.core.config import settings
from app.services.reminders import send_due_reminders

router = APIRouter()


@router.post("/run")
async def run_reminders(
    cron_secret: Annotated[str | None, Header(alias="X-Cron-Secret")] = None,
):
    if not settings.CRON_SECRET or not cron_secret or not hmac.compare_digest(cron_secret, settings.CRON_SECRET):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid cron secret")
    try:
        return await send_due_reminders()
    except RuntimeError as error:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(error)) from error
