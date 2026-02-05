"use client";

import { useState, KeyboardEvent, useRef, useImperativeHandle, forwardRef } from "react";

interface MessageInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export interface MessageInputHandle {
  focus: () => void;
}

/**
 * MessageInput component for typing and sending chat messages.
 */
const MessageInput = forwardRef<MessageInputHandle, MessageInputProps>(function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = "Type a message... (e.g., 'Add a task to buy groceries')",
}, ref) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => {
      textareaRef.current?.focus();
    }
  }));

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (trimmedMessage && !disabled) {
      onSendMessage(trimmedMessage);
      setMessage("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex-shrink-0 glass border-t border-white/10 p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full resize-none input-glass rounded-xl px-4 py-3 pr-12 text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            style={{ minHeight: "48px", maxHeight: "120px" }}
          />

          {/* Character indicator (optional, shows when typing) */}
          {message.length > 0 && (
            <span className="absolute right-4 bottom-3 text-xs text-slate-500">
              {message.length}
            </span>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="group relative px-5 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-neon-purple transition-all duration-300 hover:shadow-neon-pink hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-neon-purple"
        >
          {disabled ? (
            <span className="flex items-center gap-2">
              <svg
                className="w-5 h-5 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="hidden sm:inline">Sending</span>
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="hidden sm:inline">Send</span>
              <svg
                className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </span>
          )}
        </button>
      </div>

    </div>
  );
});

export default MessageInput;
