from typing import Literal, Optional

from pydantic import BaseModel, Field


RoleType = Literal["system", "user", "assistant"]


class Message(BaseModel):
    role: RoleType
    content: str


class ChatRequest(BaseModel):
    model_config = {
        "populate_by_name": True
    }

    chatId: str = Field(..., alias="chatId")
    roleId: str
    useMemory: bool = Field(True, alias="useMemory")
    messages: list[Message]


class ChatDelta(BaseModel):
    delta: Optional[str] = None
    conversationTitle: Optional[str] = Field(None, alias="conversationTitle")
    error: Optional[str] = None
