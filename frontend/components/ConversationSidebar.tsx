"use client";

import clsx from "clsx";
import { format } from "date-fns";

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
}

interface ConversationSidebarProps {
  conversations: ConversationSummary[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
}

export const ConversationSidebar = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation
}: ConversationSidebarProps) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Azure GPT Chat</h1>
        <button className="primary" onClick={onNewConversation}>
          + New chat
        </button>
      </div>
      <nav className="conversation-list">
        {conversations.length === 0 && <p className="empty">No chats yet.</p>}
        {conversations.map((conversation) => {
          const createdLabel = format(new Date(conversation.createdAt), "MMM d, HH:mm");
          return (
            <button
              key={conversation.id}
              className={clsx("conversation-item", {
                active: conversation.id === activeConversationId
              })}
              onClick={() => onSelectConversation(conversation.id)}
            >
              <span className="title">{conversation.title}</span>
              <span className="meta">{createdLabel}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};
