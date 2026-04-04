"use client";

import { useState, useId, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useChatStore } from "./chat-store";
import { ChatMessages } from "./chat-messages";
import { ChatInput } from "./chat-input";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isDesktop;
}

export function ChatWidget() {
  const { isOpen, toggle, close, messages, isStreaming, addMessage, appendToLast, setStreaming, clearMessages, prefillInput, clearPrefill } = useChatStore();
  const [input, setInput] = useState("");
  const idPrefix = useId();
  const isDesktop = useIsDesktop();

  useEffect(() => {
    if (isOpen && prefillInput) {
      setInput(prefillInput);
      clearPrefill();
    }
  }, [isOpen, prefillInput, clearPrefill]);

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

  const chatHeader = (
    <div className="flex items-center gap-2.5 shrink-0">
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
    </div>
  );

  const chatBody = (
    <>
      <ChatMessages
        messages={messages}
        isStreaming={isStreaming}
        onSuggestion={(s) => sendMessage(s)}
      />
      <ChatInput
        value={input}
        onChange={setInput}
        onSend={() => sendMessage()}
        disabled={isStreaming}
      />
    </>
  );

  // Desktop: Dialog modal
  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && close()}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col !p-0 !gap-0 overflow-hidden">
          <div className="px-6 py-4 border-b shrink-0">
            {chatHeader}
          </div>
          <div className="flex-1 flex flex-col overflow-hidden">
            {chatBody}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile: Bottom sheet
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/40"
            onClick={close}
          />

          <motion.div
            key="panel"
            initial={{ opacity: 0, y: "100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="fixed bottom-0 left-0 right-0 z-50 flex flex-col bg-card border-t rounded-t-3xl shadow-2xl overflow-hidden"
            style={{ height: "min(560px, calc(100vh - 5rem))" } as React.CSSProperties}
          >
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
            </div>

            <div className="flex items-center gap-2.5 px-4 py-3 border-b bg-card shrink-0">
              {chatHeader}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={close}
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            </div>

            {chatBody}

            <div className="pb-safe shrink-0" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
