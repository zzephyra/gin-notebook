from fastapi import FastAPI
from api.v1.router import api_v1
from core.semantic_service import SemanticService
from contextlib import asynccontextmanager
from core.config import settings
from core.logger import logger
from locales.i18n import init_i18n

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting up the AI Server...")
    SemanticService(settings.embedding_model_name)
    logger.info("Embedding model loaded successfully.")

    init_i18n(locales_dir="locales", supported=("en", "zh"), default_locale="en", hot_reload=True)
    yield
    # Clean up the ML models and release the resources




app = FastAPI(lifespan=lifespan)

app.include_router(router=api_v1, prefix="/api/v1")