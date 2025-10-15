from pydantic import BaseModel, Field


class PromptOptimizationRequest(BaseModel):
    prompt: str


class PromptOptimizationResponse(BaseModel):
    optimized_prompt: str = Field(..., alias="optimizedPrompt")

    model_config = {
        "populate_by_name": True
    }
