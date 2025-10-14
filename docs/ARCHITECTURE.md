# Architecture Overview

This project demonstrates a full-stack chat experience inspired by ChatGPT, powered by Azure OpenAI. It is organised as a two-application workspace: a **Next.js** front-end for the chat UI and a **FastAPI** back-end that proxies requests to Azure OpenAI models.

```
chatbot-rag-AW/
├── frontend/               # Next.js 14 app router UI
│   ├── app/                # Layout, pages, and global styles
│   ├── components/         # Reusable UI widgets
│   ├── lib/                # Client utilities (API base URL, role definitions)
│   └── public/             # Static assets (favicons, logos)
├── backend/
│   ├── app/
│   │   ├── api/routes/     # FastAPI routers (chat streaming, role lookup)
│   │   ├── core/           # Runtime configuration helpers
│   │   ├── models/         # Pydantic schemas shared across the API
│   │   ├── services/       # Azure OpenAI integration + in-memory conversation store
│   │   └── main.py         # FastAPI application factory
│   ├── requirements.txt    # Back-end dependencies
│   └── .env.example        # Environment variable template
├── docs/                   # Design documentation and prompt strategy
└── README.md               # Quickstart and deployment instructions
```

## Request lifecycle

1. **User interaction (Next.js)**
   - The chat page renders a sidebar for conversation history, a role selector, streaming message list, and a composer.
   - Each turn collects the current conversation, selected role, and memory preference before issuing a `POST /api/chat` request to the back-end. Responses stream back via [Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events) to achieve near real-time tokens.

2. **API gateway (FastAPI)**
   - `POST /api/chat` receives the request payload, instantiates a shared `ChatService`, and returns a `StreamingResponse` that relays Azure OpenAI deltas in SSE format. Errors are surfaced as dedicated SSE events followed by `[DONE]` so the UI can gracefully recover.
   - `GET /api/roles` exposes the curated presets used by the UI for role switching.

3. **Azure OpenAI integration**
   - `ChatService` builds the message list (optionally merging server-side memory), calls `AzureOpenAI.chat.completions.create(..., stream=True)`, and relays individual deltas.
   - The service also proposes a conversation title (first 60 characters of the latest user message) so the sidebar can reflect the chat topic.
   - When memory is enabled, the latest dialogue window is stored in an LRU-style `ConversationMemory` so subsequent turns can be bootstrapped even if the client omits prior context.

## Deployment considerations

- **Frontend**: The Next.js app works with either static export (for GitHub Pages) or dynamic hosting (Vercel/Azure Static Web Apps). Configure `NEXT_PUBLIC_API_BASE_URL` to point at the deployed FastAPI base URL.
- **Backend**: The FastAPI project can run on Azure App Service, Azure Container Apps, or any container-ready platform. Use the `.env.example` as a baseline and configure secrets via the platform's key vault or application settings. A production deployment should front the API with HTTPS and enforce authentication.
- **CI/CD**: Because the front-end and back-end are decoupled, you can build independent pipelines. Example:
  - `npm install && npm run build` for the Next.js app.
  - `pip install -r backend/requirements.txt && uvicorn app.main:app --host 0.0.0.0 --port 8000` for the API.

## Extensibility roadmap

- **Vector-backed memory**: Swap the in-memory store for Azure Cosmos DB, Table Storage, or a vector database to persist conversations beyond process lifetime.
- **Modular tools**: Extend `ChatService` to dispatch to specialised prompts (e.g., translation, summarisation) or integrate Azure AI Search for retrieval-augmented generation.
- **Authentication**: Add Azure AD (MSAL) to secure the API and scope usage by user identity.
- **Observability**: Capture usage metrics and traces with Application Insights to monitor latency and model costs.
