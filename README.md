# Azure ChatGPT Clone

A full-stack reference implementation of a ChatGPT-style web app powered by Azure OpenAI (e.g. `gpt-4o-mini`). The project demonstrates a responsive Next.js interface, a FastAPI back-end that streams responses, optional conversation memory, and role-based prompting.

## Features

- **Chat UI** – Modern, responsive layout with sidebar history, message composer, and streaming responses.
- **Azure OpenAI proxy** – FastAPI endpoint forwards chat completion requests and emits tokens via Server-Sent Events.
- **Role presets** – Switch between General Assistant, Recruiter, Data Analyst, and Mentor personas.
- **Conversation memory** – Toggle persistence of the latest turns (in-memory by default, extensible to external stores).
- **Extensible modules** – Ready to add translation, summarisation, or retrieval-augmented prompt templates.

## Project structure

```
frontend/      # Next.js 14 app router front-end
backend/       # FastAPI service connecting to Azure OpenAI
docs/          # Architecture notes and prompt engineering guidelines
```

See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) for a deeper dive.

## Prerequisites

- Node.js 18+ and npm (or pnpm/yarn) for the front-end.
- Python 3.10+ for the back-end.
- An Azure OpenAI resource with a deployed chat-capable model (e.g. `gpt-4o-mini`).

## Configuration

Copy the back-end environment template and provide your Azure credentials:

```bash
cp backend/.env.example backend/.env
# edit backend/.env with your endpoint, key, and deployment name
```

Key variables:

| Variable | Description |
|----------|-------------|
| `AZURE_OPENAI_ENDPOINT` | Base URL of your Azure OpenAI resource. |
| `AZURE_OPENAI_API_KEY` | API key for the resource. |
| `AZURE_OPENAI_DEPLOYMENT` | Deployment name for the model (e.g. `gpt-4o-mini`). |
| `ENABLE_CONVERSATION_MEMORY` | Toggle server-side memory (`true`/`false`). |
| `MEMORY_MAX_MESSAGES` | Maximum messages to retain in memory per chat. |

For the front-end, set `NEXT_PUBLIC_API_BASE_URL` when the API runs on a different origin.

## Running locally

### Back-end

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Front-end

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 and start chatting. The UI expects the FastAPI server at http://localhost:8000; adjust `NEXT_PUBLIC_API_BASE_URL` otherwise.

## Deployment tips

- **Frontend**: Deploy to Vercel, Azure Static Web Apps, or export static assets for GitHub Pages (`npm run build && npm run export`).
- **Backend**: Containerise with Uvicorn/Gunicorn and host on Azure App Service or Container Apps. Remember to secure environment variables via Azure Key Vault or App Settings.
- **CI/CD**: Build the front-end and back-end in separate workflows to keep pipelines fast and isolated.

## Next steps

- Integrate Azure AD for authentication and rate limiting.
- Swap in durable storage (Cosmos DB, Redis) for cross-session memory.
- Add specialised prompt templates for translation, summarisation, or custom workflows.
- Layer in telemetry (Application Insights) to monitor usage and quality.
