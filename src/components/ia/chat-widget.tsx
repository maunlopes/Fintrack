"use client";

import { useState, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChatStore } from "./chat-store";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

export function ChatWidget() {
  const { isOpen, toggle, close, messages, isStreaming, addMessage, appendToLast, setStreaming, clearMessages } = useChatStore();
  const [input, setInput] = useState("");
  const idPrefix = useId();

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || isStreaming) return;

    setInput("");

    const userMsg = { id: `${idPrefix}-u-${Date.now()}`, role: "user" as const, content };
    addMessage(userMsg);

    const assistantMsg = { id: `${idPrefix}-a-${Date.now()}`, role: "assistant" as const, content: "" };
    addMessage(assistantMsg);
    setStreaming(true);

    try {
      const history = [...messages, userMsg].map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });

      if (!res.ok || !res.body) {
        appendToLast("Desculpe, ocorreu um erro. Tente novamente.");
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          // Vercel AI SDK data stream format: `0:"text chunk"`
          if (line.startsWith("0:")) {
            try {
              const jsonStr = line.slice(2);
              const parsed = JSON.parse(jsonStr);
              if (typeof parsed === "string") {
                appendToLast(parsed);
              }
            } catch {
              // ignore parse errors on non-text lines
            }
          }
        }
      }
    } catch {
      appendToLast("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-36 left-4 z-40 lg:bottom-[4.5rem] flex flex-col rounded-2xl border bg-card shadow-2xl overflow-hidden"
            style={{
              width: "min(380px, calc(100vw - 2rem))",
              height: "min(560px, calc(100vh - 8rem))",
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-card shrink-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-none">FinBot</p>
                <p className="text-xs text-muted-foreground mt-0.5">Assistente financeiro IA</p>
              </div>
              {messages.length > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={clearMessages}
                  title="Limpar conversa"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={close}
                title="Fechar"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Messages */}
            <ChatMessages
              messages={messages}
              isStreaming={isStreaming}
              onSuggestion={(s) => sendMessage(s)}
            />

            {/* Input */}
            <ChatInput
              value={input}
              onChange={setInput}
              onSend={() => sendMessage()}
              disabled={isStreaming}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <div className="fixed bottom-20 left-4 z-50 lg:bottom-6">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground shadow-xl flex items-center justify-center ring-4 ring-primary/20 transition-shadow hover:shadow-2xl"
          aria-label="Abrir FinBot"
        >
          <motion.div
            animate={{ rotate: isOpen ? 90 : 0, scale: isOpen ? 0.85 : 1 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </motion.div>
        </motion.button>
      </div>
    </>
  );
}
