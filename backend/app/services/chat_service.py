from collections.abc import Generator, Iterable
from typing import Optional

from openai import AzureOpenAI

from ..core.config import Settings
from ..models.chat import ChatDelta, ChatRequest, Message
from ..models.prompt import PromptOptimizationResponse
from .memory import ConversationMemory


class ChatService:
    def __init__(self, settings: Settings, memory: Optional[ConversationMemory] = None) -> None:
        self._settings = settings
        self._client = AzureOpenAI(
            api_key=settings.azure.api_key,
            azure_endpoint=settings.azure.endpoint,
            api_version=settings.azure.api_version,
        )
        self._deployment = settings.azure.deployment
        self._memory = memory if settings.enable_memory else None

    def _select_messages(self, request: ChatRequest) -> list[Message]:
        if not self._memory or not request.useMemory:
            return list(request.messages)

        stored = self._memory.get(request.chatId)
        if stored and len(stored) >= len(request.messages):
            return stored

        return list(request.messages)

    def stream_chat(self, request: ChatRequest) -> Generator[str, None, None]:
        messages = self._select_messages(request)
        payload = [message.model_dump() for message in messages]
        stream = self._client.chat.completions.create(
            model=self._deployment,
            messages=payload,
            stream=True,
            temperature=0.2,
            max_tokens=900,
        )

        assistant_buffer: list[str] = []
        emitted_title = False
        last_user = next((message.content for message in reversed(messages) if message.role == "user"), "")

        try:
            for event in stream:
                if not event.choices:
                    continue

                delta = event.choices[0].delta
                if delta and delta.content:
                    assistant_buffer.append(delta.content)
                    chunk = ChatDelta(delta=delta.content)
                    if last_user and not emitted_title:
                        chunk.conversationTitle = last_user[:60]
                        emitted_title = True
                    yield f"data: {chunk.model_dump_json(by_alias=True)}\n\n"

                if event.choices[0].finish_reason:
                    if self._memory and request.useMemory:
                        updated_messages = messages + [Message(role="assistant", content="".join(assistant_buffer))]
                        self._memory.set(request.chatId, updated_messages)
                    yield "data: [DONE]\n\n"
                    break
        except Exception as exc:  # pragma: no cover - defensive
            error_chunk = ChatDelta(error=str(exc))
            yield f"data: {error_chunk.model_dump_json(by_alias=True)}\n\n"
            yield "data: [DONE]\n\n"
            raise

    def available_roles(self) -> Iterable[dict[str, str]]:
        return [
            {"id": "generalist", "label": "General Assistant"},
            {"id": "recruiter", "label": "Recruiter"},
            {"id": "data-analyst", "label": "Data Analyst"},
            {"id": "mentor", "label": "Career Mentor"},
        ]

    def optimize_prompt(self, prompt: str) -> PromptOptimizationResponse:
        if not prompt.strip():
            raise ValueError("Prompt cannot be empty.")

        response = self._client.chat.completions.create(
            model=self._deployment,
            temperature=0.4,
            max_tokens=600,
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert AI prompt engineer. Rewrite the provided prompt to be clear, "
                        "actionable, and optimized for an AI assistant. Preserve the user's intent while "
                        "adding helpful context or constraints if they are missing."
                    ),
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
        )

        if not response.choices:
            raise ValueError("No optimization was generated.")

        optimized = response.choices[0].message.content or ""
        optimized = optimized.strip()
        if not optimized:
            raise ValueError("Optimized prompt was empty.")

        return PromptOptimizationResponse(optimized_prompt=optimized)
