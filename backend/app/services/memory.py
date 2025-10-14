from collections import defaultdict, deque
from typing import Deque

from ..models.chat import Message


class ConversationMemory:
    """A lightweight in-memory conversation store."""

    def __init__(self, max_messages: int = 20) -> None:
        self._store: dict[str, Deque[Message]] = defaultdict(lambda: deque(maxlen=max_messages))

    def append(self, chat_id: str, message: Message) -> None:
        self._store[chat_id].append(message)

    def get(self, chat_id: str) -> list[Message]:
        return list(self._store[chat_id])

    def clear(self, chat_id: str) -> None:
        self._store.pop(chat_id, None)

    def set(self, chat_id: str, messages: list[Message]) -> None:
        queue = self._store[chat_id]
        queue.clear()
        if not messages:
            return

        system_messages = [message for message in messages if message.role == "system"]
        non_system = [message for message in messages if message.role != "system"]

        trimmed: list[Message] = []
        if system_messages:
            trimmed.append(system_messages[0])

        max_items = queue.maxlen or len(messages)
        remaining = max_items - len(trimmed) if max_items else len(non_system)
        if remaining > 0:
            trimmed.extend(non_system[-remaining:])

        for message in trimmed:
            queue.append(message)
