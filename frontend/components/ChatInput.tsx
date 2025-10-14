"use client";

import { FormEvent, useState } from "react";

interface ChatInputProps {
  disabled?: boolean;
  onSubmit: (value: string) => Promise<void>;
}

export const ChatInput = ({ disabled, onSubmit }: ChatInputProps) => {
  const [value, setValue] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!value.trim()) {
      return;
    }

    const payload = value;
    setValue("");
    await onSubmit(payload);
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <textarea
        placeholder="Ask me anything..."
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={1}
        disabled={disabled}
      />
      <button type="submit" className="primary" disabled={disabled}>
        Send
      </button>
    </form>
  );
};
