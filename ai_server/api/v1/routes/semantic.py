from pydantic import BaseModel
from fastapi import APIRouter, Depends
from api.v1.schemas.common import Envelope
from api.v1.schemas.semantic import *
from core.semantic_service import SemanticService
from locales.i18n import t, get_locale
from core.errors import ERROR_GET_INTENT,ERROR_GET_ACTION

router = APIRouter()


@router.post("/embed/", response_model=Envelope[EmbedResponse])
async def get_embedding(payload: EmbedRequest):
    text = payload.text
    embeding = SemanticService().embed(text)
    return Envelope(data=EmbedResponse(embeddings=embeding))


@router.post("/intent/", response_model=Envelope[IntentResponse])
async def get_intents(payload: IntentRequest, locale: str = Depends(get_locale)):
    text = payload.text
    intent, conf = SemanticService().intent_analyze(text)
    if intent == None:
        return Envelope(error=t(ERROR_GET_INTENT, locale=locale))
    return Envelope(data=IntentResponse(intent=intent, score=conf))

@router.post("/action/", response_model=Envelope[ActionResponse])
async def get_intents(payload: ActionRequest, locale: str = Depends(get_locale)):
    text = payload.text
    action, conf = SemanticService().action_analyze(text)
    if action == None:
        return Envelope(error=t(ERROR_GET_ACTION, locale=locale))
    return Envelope(data=ActionResponse(action=action, score=conf))

