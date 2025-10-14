from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.routes.chat import router as chat_router


def create_app() -> FastAPI:
    app = FastAPI(title="Azure OpenAI Chat API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(chat_router)

    @app.get("/health")
    async def health_check():
        return {"status": "ok"}

    return app


app = create_app()
