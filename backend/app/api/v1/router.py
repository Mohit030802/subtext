from fastapi import APIRouter
from .endpoints import users, clients, projects, documents, dashboard, nav, search

api_router = APIRouter()
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(clients.router, prefix="/clients", tags=["clients"])
api_router.include_router(projects.router, tags=["projects"])
api_router.include_router(documents.router, tags=["documents"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(nav.router, tags=["nav"])
api_router.include_router(search.router, tags=["search"])
