"use client";

import { FormEvent, useState } from "react";

interface PromptOptimizerProps {
  apiBaseUrl: string;
}

interface PromptOptimizationResponse {
  optimizedPrompt: string;
}

export const PromptOptimizer = ({ apiBaseUrl }: PromptOptimizerProps) => {
  const [prompt, setPrompt] = useState("");
  const [optimizedPrompt, setOptimizedPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!prompt.trim() || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setCopied(false);
    setOptimizedPrompt("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/prompt-optimize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt })
      });

      const data: PromptOptimizationResponse | { detail?: string } = await response.json();

      if (!response.ok) {
        const message = "detail" in data && data.detail ? data.detail : "Failed to optimize prompt.";
        throw new Error(message);
      }

      setOptimizedPrompt((data as PromptOptimizationResponse).optimizedPrompt.trim());
    } catch (optimizerError) {
      const message =
        optimizerError instanceof Error ? optimizerError.message : "Failed to optimize prompt.";
      setError(message);
      setOptimizedPrompt("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!optimizedPrompt) {
      return;
    }

    try {
      await navigator.clipboard.writeText(optimizedPrompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (copyError) {
      console.error("Failed to copy prompt", copyError);
    }
  };

  return (
    <section className="tool-panel prompt-optimizer">
      <form className="prompt-optimizer-form" onSubmit={handleSubmit}>
        <label htmlFor="prompt-input" className="prompt-label">
          Enter a prompt to optimize
        </label>
        <textarea
          id="prompt-input"
          className="prompt-input"
          placeholder="Describe the task you want the AI to perform..."
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={4}
        />
        <div className="prompt-optimizer-actions">
          <button type="submit" className="primary" disabled={isLoading}>
            {isLoading ? "Optimizing..." : "Optimize"}
          </button>
        </div>
      </form>
      <div className="prompt-optimizer-result">
        <div className="prompt-optimizer-result-header">
          <h3>Optimized prompt</h3>
          <button
            type="button"
            className="secondary"
            onClick={handleCopy}
            disabled={!optimizedPrompt}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <textarea
          className="prompt-output"
          value={optimizedPrompt}
          placeholder="Your improved prompt will appear here."
          readOnly
          rows={Math.max(optimizedPrompt.split("\n").length, 4)}
        />
      </div>
      {error && <p className="tool-error">{error}</p>}
    </section>
  );
};
