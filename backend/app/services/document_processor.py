"""
Document Processing Pipeline
=============================
1. Download file bytes from Google Drive (using user's GIS access token)
2. Extract raw text (PDF → PyMuPDF, Google Doc → Drive export, DOCX → python-docx)
3. Analyze with Gemini → risks, obligations, summary, risk_score
4. Persist to DB (clause_risks, obligations, update document)

Runs as a FastAPI BackgroundTask so the import API returns immediately.
"""
import io
import json
import logging
import re
import uuid
from datetime import date, datetime, timezone

import pymupdf  # PyMuPDF (new import name)
import httpx
from google import genai
from google.genai import types as genai_types
from docx import Document as DocxDocument
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.database import AsyncSessionLocal
from app.models.clause_risk import ClauseRisk
from app.models.document import Document
from app.models.obligation import Obligation

log = logging.getLogger("subtext.processor")

# ── Gemini setup ─────────────────────────────────────────────────────────────
_genai_client = genai.Client(api_key=settings.GOOGLE_API_KEY)
GEMINI_MODEL = "gemini-3.6-flash"   # Latest available for this API key

ANALYSIS_PROMPT = """You are an expert legal AI assistant specializing in contract analysis.

Analyze the following contract text and return ONLY a valid JSON object with this exact structure (no markdown, no explanation):

{{
  "risk_score": "HIGH" or "MEDIUM" or "LOW",
  "summary": {{
    "overview": "2-3 sentence plain English overview of the contract",
    "key_points": ["key point 1", "key point 2", "key point 3"],
    "parties": ["Party A name", "Party B name"]
  }},
  "clause_risks": [
    {{
      "clause_text": "exact or near-exact text from the contract",
      "risk_level": "HIGH" or "MEDIUM" or "LOW",
      "explanation": "why this clause is risky and what the exposure is",
      "suggested_redline": "suggested replacement language to reduce risk"
    }}
  ],
  "obligations": [
    {{
      "title": "short action title (max 8 words)",
      "description": "what needs to be done and by whom",
      "due_date": "YYYY-MM-DD if a specific date is mentioned, otherwise null",
      "obligation_type": "RENEWAL_NOTICE" or "PAYMENT" or "DELIVERABLE" or "EXPIRY" or "COMPLIANCE" or "OTHER",
      "party_responsible": "CLIENT" or "US" or "THIRD_PARTY"
    }}
  ]
}}

Rules:
- Include 3-8 clause_risks (focus on the most important ones)
- Include all material obligations you find
- risk_score should reflect the overall contract risk level
- For due_date, only include if a specific date is explicitly stated
- If the text is too short or unclear to analyze, return minimal valid JSON

Contract title: {title}

Contract text:
{text}"""


# ── Step 1: Download from Google Drive ───────────────────────────────────────

async def download_from_drive(file_id: str, access_token: str, mime_type: str) -> bytes:
    """Download file bytes from Google Drive using the user's access token."""
    headers = {"Authorization": f"Bearer {access_token}"}

    async with httpx.AsyncClient(timeout=60) as client:
        if mime_type == "application/vnd.google-apps.document":
            # Google Docs → export as plain text
            url = f"https://www.googleapis.com/drive/v3/files/{file_id}/export"
            r = await client.get(url, headers=headers, params={"mimeType": "text/plain"})
        else:
            # PDF / DOCX → download directly
            url = f"https://www.googleapis.com/drive/v3/files/{file_id}?alt=media"
            r = await client.get(url, headers=headers)

        if r.status_code != 200:
            raise RuntimeError(f"Drive download failed: {r.status_code} {r.text[:200]}")

        return r.content


# ── Step 2: Extract text ──────────────────────────────────────────────────────

def extract_text(content: bytes, mime_type: str) -> str:
    """Extract plain text from file bytes based on MIME type."""
    if mime_type == "application/vnd.google-apps.document":
        # Already plain text from the export
        return content.decode("utf-8", errors="ignore")

    if mime_type == "application/pdf":
        doc = pymupdf.open(stream=content, filetype="pdf")
        pages = []
        for page in doc:
            pages.append(page.get_text())
        doc.close()
        return "\n\n".join(pages)

    if mime_type in (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
    ):
        docx = DocxDocument(io.BytesIO(content))
        return "\n".join(p.text for p in docx.paragraphs if p.text.strip())

    # Fallback: try treating as UTF-8 text
    return content.decode("utf-8", errors="ignore")


# ── Step 3: Analyze with Gemini ───────────────────────────────────────────────

async def analyze_with_gemini(text: str, title: str) -> dict:
    """Send contract text to Gemini, get back structured analysis."""
    truncated = text[:100_000]
    prompt = ANALYSIS_PROMPT.format(title=title, text=truncated)

    print(f"[processor] Calling Gemini model={GEMINI_MODEL}, text_len={len(truncated)}", flush=True)

    # Use the async client interface directly — no run_in_executor needed
    response = await _genai_client.aio.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=genai_types.GenerateContentConfig(
            temperature=0.1,
            response_mime_type="application/json",
        ),
    )

    raw = response.text.strip()
    print(f"[processor] Gemini response len={len(raw)}, preview={raw[:80]}", flush=True)

    # Strip markdown code fences if Gemini wrapped it
    raw = re.sub(r"^```(?:json)?\s*", "", raw)
    raw = re.sub(r"\s*```$", "", raw)

    return json.loads(raw)


# ── Step 4: Persist results to DB ────────────────────────────────────────────

async def _save_analysis(db: AsyncSession, doc: Document, analysis: dict, raw_text: str):
    """Write analysis results back to the document + create risk/obligation records."""
    # Update document
    doc.raw_text = raw_text[:500_000]
    doc.risk_score = analysis.get("risk_score", "LOW")
    doc.summary = analysis.get("summary", {})
    doc.status = "ANALYZED"
    doc.analyzed_at = datetime.utcnow()  # naive UTC — matches TIMESTAMP WITHOUT TIME ZONE column

    # Clause risks
    for item in analysis.get("clause_risks", []):
        risk = ClauseRisk(
            document_id=doc.id,
            clause_text=item.get("clause_text", "")[:5000],
            risk_level=item.get("risk_level", "LOW"),
            explanation=item.get("explanation", ""),
            suggested_redline=item.get("suggested_redline"),
        )
        db.add(risk)

    # Obligations
    VALID_OBL_TYPES = {"RENEWAL_NOTICE", "PAYMENT", "DELIVERABLE", "EXPIRY", "COMPLIANCE", "OTHER"}
    VALID_PARTIES   = {"CLIENT", "US", "THIRD_PARTY"}
    # Coercion maps for common Gemini hallucinations → nearest valid value
    OBL_TYPE_MAP = {
        "DELIVERY": "DELIVERABLE", "RENEWAL": "RENEWAL_NOTICE",
        "REPORTING": "COMPLIANCE",  "NOTICE": "RENEWAL_NOTICE",
    }
    PARTY_MAP = {
        "VENDOR": "THIRD_PARTY", "BOTH": "THIRD_PARTY",
        "SUPPLIER": "THIRD_PARTY", "CONTRACTOR": "THIRD_PARTY",
    }

    for item in analysis.get("obligations", []):
        raw_date = item.get("due_date")
        due = None
        if raw_date:
            try:
                due = date.fromisoformat(raw_date)
            except (ValueError, TypeError):
                due = None

        raw_type  = item.get("obligation_type", "OTHER").upper()
        raw_party = item.get("party_responsible", "US").upper()
        obl_type  = OBL_TYPE_MAP.get(raw_type,  raw_type)  if raw_type  not in VALID_OBL_TYPES else raw_type
        party     = PARTY_MAP.get(raw_party, raw_party)    if raw_party not in VALID_PARTIES   else raw_party
        # Final fallback
        if obl_type not in VALID_OBL_TYPES: obl_type = "OTHER"
        if party    not in VALID_PARTIES:   party    = "THIRD_PARTY"

        obl = Obligation(
            document_id=doc.id,
            project_id=doc.project_id,
            title=item.get("title", "Obligation")[:500],
            description=item.get("description"),
            due_date=due,
            obligation_type=obl_type,
            party_responsible=party,
            status="PENDING",
        )
        db.add(obl)

    await db.commit()
    log.info(f"Document {doc.id} processed: risk_score={doc.risk_score}")


# ── Main entry point (runs as BackgroundTask) ─────────────────────────────────

async def process_document_background(document_id: str, drive_access_token: str):
    """
    Called by FastAPI BackgroundTasks after the import API responds.
    Creates its own DB session (the request session is already closed).
    Skips processing if document is already PROCESSED.
    """
    print(f"\n{'='*60}", flush=True)
    print(f"[processor] START  document_id={document_id}", flush=True)
    print(f"{'='*60}", flush=True)

    async with AsyncSessionLocal() as db:
        try:
            # Fetch document
            result = await db.execute(select(Document).where(Document.id == uuid.UUID(document_id)))
            doc = result.scalar_one_or_none()

            if not doc:
                print(f"[processor] ERROR: document {document_id} not found in DB", flush=True)
                return

            if doc.status == "ANALYZED":
                print(f"[processor] SKIP: already processed", flush=True)
                return

            print(f"[processor] Document: '{doc.title}' | mime={doc.google_drive_mime_type} | file_id={doc.google_drive_file_id}", flush=True)

            # Mark as processing
            doc.status = "PROCESSING"
            await db.commit()

            # Step 1: Download
            print(f"[processor] STEP 1: Downloading from Google Drive...", flush=True)
            content = await download_from_drive(
                file_id=str(doc.google_drive_file_id),
                access_token=drive_access_token,
                mime_type=doc.google_drive_mime_type or "application/pdf",
            )
            print(f"[processor] STEP 1: Downloaded {len(content):,} bytes", flush=True)

            # Step 2: Extract text
            print(f"[processor] STEP 2: Extracting text...", flush=True)
            raw_text = extract_text(content, doc.google_drive_mime_type or "application/pdf")
            print(f"[processor] STEP 2: Extracted {len(raw_text):,} chars | preview: {raw_text[:80]!r}", flush=True)

            if len(raw_text.strip()) < 50:
                raise ValueError("Extracted text is too short — the file may be empty or image-only PDF")

            # Step 3: Gemini analysis
            print(f"[processor] STEP 3: Sending to Gemini ({GEMINI_MODEL})...", flush=True)
            analysis = await analyze_with_gemini(raw_text, doc.title)
            print(f"[processor] STEP 3: Analysis done | risk_score={analysis.get('risk_score')} | risks={len(analysis.get('clause_risks', []))} | obligations={len(analysis.get('obligations', []))}", flush=True)

            # Step 4: Persist
            print(f"[processor] STEP 4: Saving to DB...", flush=True)
            await _save_analysis(db, doc, analysis, raw_text)
            print(f"[processor] DONE  ✓  status=PROCESSED", flush=True)
            print(f"{'='*60}\n", flush=True)

        except Exception as e:
            print(f"[processor] FAILED: {type(e).__name__}: {e}", flush=True)
            import traceback
            traceback.print_exc()
            # Mark as failed so the UI can show an error state
            try:
                async with AsyncSessionLocal() as err_db:
                    err_result = await err_db.execute(
                        select(Document).where(Document.id == uuid.UUID(document_id))
                    )
                    err_doc = err_result.scalar_one_or_none()
                    if err_doc:
                        err_doc.status = "FAILED"
                        await err_db.commit()
                        print(f"[processor] Marked document as FAILED", flush=True)
            except Exception as db_err:
                print(f"[processor] Could not mark as FAILED: {db_err}", flush=True)
