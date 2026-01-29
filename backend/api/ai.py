from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from services.llm_service import AIService

router = APIRouter(prefix="/ai", tags=["AI"])

# Initialiser le service IA
ai_service = AIService()


class RefineRequest(BaseModel):
    message: str
    history: List[dict] = []


class SuggestRequest(BaseModel):
    conversation: List[dict]


class AIResponse(BaseModel):
    suggestions: List[str]


@router.post("/refine", response_model=AIResponse)
async def refine_message(request: RefineRequest):
    """Reformuler un message avec des suggestions IA"""
    try:
        suggestions = await ai_service.refine_message(request.message, request.history)
        return AIResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/suggest", response_model=AIResponse)
async def suggest_response(request: SuggestRequest):
    """Obtenir des suggestions IA pour une réponse"""
    try:
        suggestions = await ai_service.suggest_response(request.conversation)
        return AIResponse(suggestions=suggestions)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
