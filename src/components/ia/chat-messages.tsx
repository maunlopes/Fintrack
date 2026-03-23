"use client";

import { useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "./chat-store";

const SUGGESTIONS = [
  "Como está minha saúde financeira?",
  "Onde estou gastando mais este mês?",
  "Quantos meses para juntar R$ 10.000?",
];

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onSuggestion: (text: string) => void;
}

export function ChatMessages({ messages, isStreaming, onSuggestion }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
          <Sparkles className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="font-semibold text-sm">Olá! Sou o FinBot.</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pergunte qualquer coisa sobre suas finanças.
          </p>
        </div>
        <div className="flex flex-col gap-2 w-full max-w-[260px]">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => onSuggestion(s)}
              className="text-xs text-left rounded-xl border px-3 py-2 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={cn(
            "flex",
            msg.role === "user" ? "justify-end" : "justify-start"
          )}
        >
          <div
            className={cn(
              "max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap",
              msg.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            )}
          >
            {msg.content}
            {msg.role === "assistant" && isStreaming && msg === messages[messages.length - 1] && (
              <span className="inline-block w-1.5 h-3.5 ml-0.5 bg-current rounded-sm animate-pulse" />
            )}
          </div>
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
