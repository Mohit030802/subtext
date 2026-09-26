import logging
import traceback
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from app.core.config import settings
from app.core.database import engine
from app.api.v1.router import api_router

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("subtext")


# ── Lifespan (startup / shutdown) ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ──
    log.info("━" * 52)
    log.info("🚀  Subtext API  —  starting up")
    log.info("━" * 52)

    # Test database connection
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT version()"))
            version = result.scalar()
            log.info("✅  Database connected successfully")
            log.info(f"    Host     : localhost:5432")
            log.info(f"    Database : subtext")
            log.info(f"    User     : postgres")
            log.info(f"    PG Ver   : {version.split(',')[0]}")
    except Exception as e:
        log.error("❌  Database connection FAILED")
        log.error(f"    Error: {e}")
        log.error("    Make sure pgAdmin / PostgreSQL is running and the 'subtext' database exists.")

    log.info("━" * 52)
    log.info(f"📡  API docs  →  http://localhost:8000/docs")
    log.info(f"❤️   Health   →  http://localhost:8000/health")
    log.info("━" * 52)

    yield

    # ── Shutdown ──
    await engine.dispose()
    log.info("👋  Subtext API  —  shut down cleanly")


# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Subtext API",
    description="AI Contract Intelligence & Lifecycle Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


# ── Global exception handler — always return JSON, log the real error ──────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    tb = traceback.format_exc()
    log.error(f"Unhandled exception on {request.method} {request.url.path}:\n{tb}")
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc), "type": type(exc).__name__},
    )


@app.get("/health")
async def health_check():
    """Quick liveness check."""
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception:
        db_status = "unreachable"

    return {
        "status": "healthy",
        "app": "subtext",
        "database": db_status,
    }
