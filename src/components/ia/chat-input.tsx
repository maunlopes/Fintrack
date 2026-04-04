"use client";

import { useRef } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
}

export function ChatInput({ value, onChange, onSend, disabled }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 120) + "px";
    }
  };

  return (
    <div className="flex items-end gap-2 p-3 border-t bg-card">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Pergunte algo sobre suas finanças…"
        rows={1}
        className="flex-1 resize-none rounded-xl px-3 py-2 text-sm leading-relaxed min-h-[38px] max-h-[120px]"
      />
      <Button
        size="icon"
        onClick={onSend}
        disabled={disabled || !value.trim()}
        className="shrink-0 h-9 w-9 rounded-xl"
      >
        <Send className="w-4 h-4" />
      </Button>
    </div>
  );
}
