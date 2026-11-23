import asyncio
import logging
import smtplib
from datetime import date, datetime
from email.message import EmailMessage

from sqlalchemy import select

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.client import Client
from app.models.document import Document
from app.models.obligation import Obligation
from app.models.project import Project
from app.models.user import User

log = logging.getLogger("subtext.reminders")


def _send_email(recipient: str, subject: str, text: str, html: str) -> None:
    message = EmailMessage()
    message["From"] = settings.EMAIL_FROM
    message["To"] = recipient
    message["Subject"] = subject
    message.set_content(text)
    message.add_alternative(html, subtype="html")

    with smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as smtp:
        smtp.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        smtp.send_message(message)


async def send_due_reminders() -> dict[str, int]:
    """Email each owner once when a pending latest-version obligation is due soon."""
    if not all((settings.SMTP_USERNAME, settings.SMTP_PASSWORD, settings.EMAIL_FROM)):
        raise RuntimeError("Gmail Workspace SMTP is not configured")

    reminder_date = date.today().fromordinal(date.today().toordinal() + settings.REMINDER_LEAD_DAYS)
    sent = 0
    failed = 0

    async with AsyncSessionLocal() as db:
        statement = (
            select(Obligation, User, Client, Project, Document)
            .join(Document, Document.id == Obligation.document_id)
            .join(Project, Project.id == Obligation.project_id)
            .join(Client, Client.id == Project.client_id)
            .join(User, User.id == Client.user_id)
            .where(
                Obligation.status == "PENDING",
                Obligation.due_date == reminder_date,
                Obligation.reminder_sent_at.is_(None),
                Document.is_latest.is_(True),
            )
        )
        rows = (await db.execute(statement)).all()

        for obligation, user, client, project, document in rows:
            subject = f"Reminder: {obligation.title} is due in {settings.REMINDER_LEAD_DAYS} days"
            due_date = f"{obligation.due_date.strftime('%B')} {obligation.due_date.day}, {obligation.due_date.year}"
            text = (
                f"Hi {user.name or user.email},\n\n"
                f"{obligation.title} is due on {due_date} ({settings.REMINDER_LEAD_DAYS} days from now).\n\n"
                f"Client: {client.name}\nProject: {project.name}\nDocument: {document.title}\n\n"
                f"Details: {obligation.description or 'No additional details were extracted.'}\n\n"
                "— Subtext"
            )
            html = (
                f"<p>Hi {user.name or user.email},</p>"
                f"<p><strong>{obligation.title}</strong> is due on <strong>{due_date}</strong> "
                f"({settings.REMINDER_LEAD_DAYS} days from now).</p>"
                f"<p><strong>Client:</strong> {client.name}<br>"
                f"<strong>Project:</strong> {project.name}<br>"
                f"<strong>Document:</strong> {document.title}</p>"
                f"<p>{obligation.description or 'No additional details were extracted.'}</p>"
                "<p>— Subtext</p>"
            )
            try:
                await asyncio.to_thread(_send_email, user.email, subject, text, html)
                obligation.reminder_sent_at = datetime.utcnow()
                sent += 1
            except Exception:
                failed += 1
                log.exception("Could not send reminder for obligation %s", obligation.id)

        await db.commit()

    return {"due_date": reminder_date.isoformat(), "sent": sent, "failed": failed}
