from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from ...core.config import get_settings
from ...models.chat import ChatRequest
from ...services.chat_service import ChatService
from ...services.memory import ConversationMemory

router = APIRouter(prefix="/api", tags=["chat"])

_chat_service: ChatService | None = None
_memory_store: ConversationMemory | None = None


def service_dependency() -> ChatService:
    global _chat_service, _memory_store
    try:
        settings = get_settings()
    except ValueError as exc:
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    if _memory_store is None:
        _memory_store = ConversationMemory(settings.max_memory_messages)
    if _chat_service is None:
        _chat_service = ChatService(settings=settings, memory=_memory_store)
    return _chat_service


@router.post("/chat")
async def chat_completion(payload: ChatRequest, service: ChatService = Depends(service_dependency)):
    try:
        generator = service.stream_chat(payload)
        return StreamingResponse(generator, media_type="text/event-stream")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/roles")
async def list_roles(service: ChatService = Depends(service_dependency)):
    return {"items": list(service.available_roles())}
