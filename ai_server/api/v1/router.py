from fastapi import APIRouter, Depends
from api.v1.routes import semantic
api_v1 = APIRouter()
api_v1.include_router(semantic.router, tags=["embed"])