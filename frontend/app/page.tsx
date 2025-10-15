"use client";

import { useCallback, useMemo, useState } from "react";
import { ChatInput } from "../components/ChatInput";
import { ConversationSidebar, ConversationSummary } from "../components/ConversationSidebar";
import { Message, MessageList } from "../components/MessageList";
import { RoleSelector } from "../components/RoleSelector";
import { getApiBaseUrl, ChatStreamChunk } from "../lib/api";
import { ROLE_PRESETS, RoleDefinition } from "../lib/roles";

interface Conversation extends ConversationSummary {
  roleId: string;
  useMemory: boolean;
  messages: Message[];
}

const createConversation = (role: RoleDefinition): Conversation => {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: role.label,
    createdAt: now,
    roleId: role.id,
    useMemory: true,
    messages: [
      {
        id: crypto.randomUUID(),
        role: "system",
        content: role.systemPrompt,
        createdAt: now
      }
    ]
  };
};

const findRole = (roleId: string) => ROLE_PRESETS.find((role) => role.id === roleId) ?? ROLE_PRESETS[0];

export default function HomePage() {
  const defaultRole = ROLE_PRESETS[0];
  const [conversations, setConversations] = useState<Conversation[]>(() => [createConversation(defaultRole)]);
  const [activeConversationId, setActiveConversationId] = useState<string>(() => conversations[0].id);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === activeConversationId) ?? conversations[0],
    [activeConversationId, conversations]
  );

  const apiBaseUrl = getApiBaseUrl();

  const updateConversation = useCallback(
    (conversationId: string, updater: (conversation: Conversation) => Conversation) => {
      setConversations((current) =>
        current.map((conversation) => (conversation.id === conversationId ? updater(conversation) : conversation))
      );
    },
    []
  );

  const handleNewConversation = () => {
    const role = findRole(activeConversation?.roleId ?? defaultRole.id);
    const conversation = createConversation(role);
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
  };

  const handleOpenPromptLibrary = useCallback(() => {
    window.open(
      "https://learn.microsoft.com/azure/ai-services/openai/how-to/use-prompt-library",
      "_blank",
      "noopener,noreferrer"
    );
  }, []);

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId);
    setError(null);
  };

  const handleRoleChange = (roleId: string) => {
    const role = findRole(roleId);
    updateConversation(activeConversation.id, (conversation) => {
      const now = new Date().toISOString();
      const [systemMessage, ...rest] = conversation.messages;
      const updatedSystemMessage: Message = {
        ...systemMessage,
        content: role.systemPrompt,
        createdAt: now
      };

      return {
        ...conversation,
        roleId: role.id,
        title: role.label,
        messages: [updatedSystemMessage, ...rest]
      };
    });
  };

  const handleToggleMemory = () => {
    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      useMemory: !conversation.useMemory
    }));
  };

  const handleSendMessage = async (content: string) => {
    if (!activeConversation) {
      return;
    }

    const role = findRole(activeConversation.roleId);
    const timestamp = new Date().toISOString();
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      createdAt: timestamp
    };

    const messagesForApi = activeConversation.messages.map((message) => ({
      role: message.role,
      content: message.content
    }));
    messagesForApi.push({ role: "user", content });

    const placeholderId = crypto.randomUUID();
    const placeholderMessage: Message = {
      id: placeholderId,
      role: "assistant",
      content: "",
      createdAt: timestamp
    };

    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: [...conversation.messages, userMessage, placeholderMessage]
    }));

    setIsStreaming(true);
    setError(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatId: activeConversation.id,
          roleId: role.id,
          useMemory: activeConversation.useMemory,
          messages: messagesForApi
        })
      });

      if (!response.ok || !response.body) {
        throw new Error(`Chat request failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamOpen = true;

      const processBuffer = () => {
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const event of events) {
          if (!event.startsWith("data:")) {
            continue;
          }
          const data = event.replace(/^data:\s*/, "");
          if (data === "[DONE]") {
            updateConversation(activeConversation.id, (conversation) => ({
              ...conversation,
              title: conversation.title || role.label
            }));
            streamOpen = false;
            return;
          }

          try {
            const payload: ChatStreamChunk = JSON.parse(data);
            if (payload.delta) {
              updateConversation(activeConversation.id, (conversation) => ({
                ...conversation,
                messages: conversation.messages.map((message) =>
                  message.id === placeholderId
                    ? { ...message, content: `${message.content}${payload.delta}` }
                    : message
                )
              }));
            }
            if (payload.conversationTitle) {
              updateConversation(activeConversation.id, (conversation) => ({
                ...conversation,
                title: payload.conversationTitle
              }));
            }
            if (payload.error) {
              throw new Error(payload.error);
            }
          } catch (chunkError) {
            console.error("Failed to parse chunk", chunkError);
          }
        }
      };

      while (streamOpen) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer.length > 0) {
            processBuffer();
          }
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        processBuffer();
      }
    } catch (chatError) {
      console.error(chatError);
      setError(chatError instanceof Error ? chatError.message : "Unknown error");
      updateConversation(activeConversation.id, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === placeholderId ? { ...message, content: "(Something went wrong. Please try again.)" } : message
        )
      }));
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <main className="shell">
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversation.id}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
      />
      <section className="chat-area">
        <header className="chat-header">
          <div className="tool-bar" role="navigation" aria-label="Tools">
            <span className="tool-bar-label">Tools</span>
            <div className="tool-bar-actions">
              <button type="button" className="tool-pill" onClick={handleOpenPromptLibrary}>
                Prompt library
              </button>
            </div>
          </div>
          <RoleSelector roles={ROLE_PRESETS} activeRoleId={activeConversation.roleId} onRoleChange={handleRoleChange} />
          <div className="toggles">
            <label>
              <input type="checkbox" checked={activeConversation.useMemory} onChange={handleToggleMemory} />
              Memory
            </label>
          </div>
        </header>
        <MessageList messages={activeConversation.messages} isStreaming={isStreaming} />
        {error && <p className="error">{error}</p>}
        <ChatInput disabled={isStreaming} onSubmit={handleSendMessage} />
      </section>
    </main>
  );
}
