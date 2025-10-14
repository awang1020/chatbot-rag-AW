# Prompt engineering strategy

The assistant supports multiple roles by injecting curated system prompts and optional tools. Each role emphasises tone, structure, and domain-specific guidance to keep responses grounded while remaining concise.

## Role presets

| Role ID       | System prompt summary                                                                 |
|---------------|----------------------------------------------------------------------------------------|
| `generalist`  | Friendly, balanced assistant that provides direct, actionable answers.                 |
| `recruiter`   | Technical recruiter that asks clarifying questions and discusses candidate fit.        |
| `data-analyst`| Senior analyst that explains metrics, SQL, and visualisations with a business mindset. |
| `mentor`      | Encouraging mentor who outlines next steps, resources, and reflective questions.       |

The UI sends the selected role identifier along with the running conversation. The back-end can map these identifiers to richer prompt templates if you want to centralise prompt management.

## Conversation framing

1. **System message** – Derived from the active role. This primes the assistant before any user content.
2. **Memory window** – When enabled, the server persists the most recent turns to keep context without sending every previous exchange. You can swap in a persistent store (Cosmos DB, Redis, Supabase) to share context across devices.
3. **User turns** – The latest user message is appended to the payload. The API streams the assistant reply, ensuring the front-end can render tokens incrementally.

## Optional modules

The API can be extended with prompt templates for:

- **Translation** – Prefix the system prompt with “You are a professional translator…” and include target language parameters.
- **Summarisation** – Provide instructions about length, tone, and highlight extraction.
- **Document Q&A** – Attach retrieved passages (e.g., via Azure AI Search) as system or tool messages, instructing the assistant to cite sources.
- **Code review** – Offer a role that analyses diffs and suggests improvements.

## Few-shot examples

For complex behaviours, enrich the system prompt with exemplar dialogues. For example, the recruiter role could include a short conversation showing how to ask follow-up questions before rating a candidate. Remember to keep examples concise to conserve tokens.

## Safety and guardrails

- Implement Azure content filters or moderation endpoints before invoking the chat completion.
- Adjust the system prompt to remind the assistant to refuse disallowed requests and to cite limitations.
- Expose a configuration surface (environment variables or CMS) so you can tweak prompts without redeploying the UI.
