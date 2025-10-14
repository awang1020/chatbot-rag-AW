"use client";

import clsx from "clsx";

export interface Message {
  id: string;
  role: "system" | "user" | "assistant";
  content: string;
  createdAt: string;
}

interface MessageListProps {
  messages: Message[];
  isStreaming: boolean;
}

export const MessageList = ({ messages, isStreaming }: MessageListProps) => {
  return (
    <div className="messages" data-streaming={isStreaming}>
      {messages.map((message) => (
        <article key={message.id} className={clsx("message", message.role)}>
          <header>{message.role === "user" ? "You" : message.role === "assistant" ? "Assistant" : "System"}</header>
          <p>{message.content}</p>
        </article>
      ))}
    </div>
  );
};
