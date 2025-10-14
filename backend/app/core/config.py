import os
from functools import lru_cache

from pydantic import BaseModel


class AzureOpenAIConfig(BaseModel):
    endpoint: str
    api_key: str
    deployment: str
    api_version: str = "2024-02-01"


class Settings(BaseModel):
    azure: AzureOpenAIConfig
    enable_memory: bool = True
    max_memory_messages: int = 20

    @staticmethod
    def load_from_env() -> "Settings":
        endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
        api_key = os.getenv("AZURE_OPENAI_API_KEY")
        deployment = os.getenv("AZURE_OPENAI_DEPLOYMENT")
        api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-02-01")

        if not all([endpoint, api_key, deployment]):
            raise ValueError("Azure OpenAI environment variables are not fully configured.")

        azure_config = AzureOpenAIConfig(
            endpoint=endpoint,
            api_key=api_key,
            deployment=deployment,
            api_version=api_version,
        )

        enable_memory = os.getenv("ENABLE_CONVERSATION_MEMORY", "true").lower() == "true"
        max_memory_messages = int(os.getenv("MEMORY_MAX_MESSAGES", "20"))

        return Settings(azure=azure_config, enable_memory=enable_memory, max_memory_messages=max_memory_messages)


@lru_cache
def get_settings() -> Settings:
    return Settings.load_from_env()
