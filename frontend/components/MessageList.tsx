"use client";

import { useEffect, useRef } from "react";

interface Message {
  id: string | number;
  role: "user" | "assistant";
  content: string;
  tool_calls?: Array<{
    name: string;
    arguments: Record<string, unknown>;
  }> | null;
}

interface MessageListProps {
  messages: Message[];
  isLoading?: boolean;
}

/**
 * MessageList component for displaying chat messages with gradient styling.
 */
export default function MessageList({
  messages,
  isLoading = false,
}: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center max-w-md animate-fade-in">
          {/* Icon */}
          <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 flex items-center justify-center mb-6">
            <svg
              className="w-10 h-10 text-purple-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          <h3 className="text-xl font-semibold text-white mb-2">
            No messages yet
          </h3>
          <p className="text-slate-400 mb-8">
            Start a conversation by typing a message below.
          </p>

          {/* Example commands */}
          <div className="glass-card rounded-xl p-5 text-left">
            <p className="text-sm font-medium text-purple-400 mb-3">Try saying:</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></span>
                &quot;Add a task 1 to buy groceries or Add task 2 to buy vegetables&quot;
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 bg-pink-400 rounded-full"></span>
                &quot;Show me my tasks list&quot;
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 bg-purple-400 rounded-full"></span>
                &quot;Mark tasks as complete&quot;
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 bg-red-400 rounded-full"></span>
                &quot;Delete tasks&quot;
              </li>
              <li className="flex items-center gap-2 text-sm text-slate-300">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
                &quot;Update tasks&quot;
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full p-4 space-y-4">
      {messages.map((message, index) => (
        <div
          key={message.id}
          className={`flex items-start gap-3 animate-slide-up ${
            message.role === "user" ? "flex-row-reverse" : "flex-row"
          }`}
          style={{ animationDelay: `${Math.min(index * 0.05, 0.3)}s` }}
        >
          {/* Avatar */}
          <div className={`flex-shrink-0 ${message.role === "user" ? "avatar avatar-user" : "avatar avatar-assistant"}`}>
            {message.role === "user" ? (
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            )}
          </div>

          {/* Message bubble */}
          <div
            className={`max-w-[75%] px-4 py-3 transition-transform duration-200 hover:scale-[1.02] ${
              message.role === "user"
                ? "bubble-user"
                : "bubble-assistant"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>

            {/* Tool calls indicator */}
            {message.tool_calls && message.tool_calls.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-cyan-400">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>
                    Actions: {message.tool_calls.map((tc) => tc.name).join(", ")}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Typing indicator */}
      {isLoading && (
        <div className="flex items-start gap-3 animate-fade-in">
          <div className="avatar avatar-assistant">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="bubble-assistant px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
                <div className="typing-dot"></div>
              </div>
              <span className="text-sm text-slate-400">AI is thinking...</span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}
