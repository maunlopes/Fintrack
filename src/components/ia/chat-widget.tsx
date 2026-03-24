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
        if (chunk) appendToLast(chunk);
      }
    } catch {
      appendToLast("Erro de conexão. Verifique sua internet e tente novamente.");
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Mobile backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              onClick={close}
            />

            {/* Panel
                Mobile: full-width sheet from bottom
                Desktop: floating panel above the FAB  */}
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", stiffness: 380, damping: 38 }}
              className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card border-t rounded-t-3xl shadow-2xl overflow-hidden
                         lg:bottom-[4.5rem] lg:left-4 lg:right-auto lg:rounded-2xl lg:border"
              style={{
                height: "min(560px, calc(100vh - 5rem))",
                // desktop: fixed width
              } as React.CSSProperties}
            >
              {/* Mobile drag handle */}
              <div className="flex justify-center pt-3 pb-1 shrink-0 lg:hidden">
                <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
              </div>

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

              {/* Safe area spacer — mobile only */}
              <div className="pb-safe shrink-0 lg:hidden" />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* FAB — desktop only; mobile uses bottom nav center button */}
      <div className="hidden lg:block fixed bottom-6 left-4 z-50">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={toggle}
          className="w-12 h-12 rounded-full bg-primary/90 text-primary-foreground shadow-xl flex items-center justify-center ring-4 ring-primary/20 hover:shadow-2xl"
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
