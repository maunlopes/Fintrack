"use client";

import { useState, useEffect } from "react";
import { Info, AlertTriangle, Wrench, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "MAINTENANCE" | "NEW_FEATURE";
}

const typeConfig = {
  INFO: { icon: Info, bg: "bg-blue-500/10", border: "border-l-blue-500", text: "text-blue-700 dark:text-blue-400" },
  WARNING: { icon: AlertTriangle, bg: "bg-yellow-500/10", border: "border-l-yellow-500", text: "text-yellow-700 dark:text-yellow-400" },
  MAINTENANCE: { icon: Wrench, bg: "bg-red-500/10", border: "border-l-red-500", text: "text-red-700 dark:text-red-400" },
  NEW_FEATURE: { icon: Sparkles, bg: "bg-green-500/10", border: "border-l-green-500", text: "text-green-700 dark:text-green-400" },
};

export function SystemBanner() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/notifications/active")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setNotifications(data);
      })
      .catch(() => {});
  }, []);

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-0">
      {visible.map((n) => {
        const config = typeConfig[n.type] || typeConfig.INFO;
        const Icon = config.icon;
        return (
          <div
            key={n.id}
            className={cn("flex items-center gap-3 px-4 py-2.5 border-l-4", config.bg, config.border)}
          >
            <Icon className={cn("w-4 h-4 shrink-0", config.text)} />
            <div className="flex-1 min-w-0">
              <span className={cn("text-sm font-medium", config.text)}>{n.title}</span>
              <span className="text-sm text-muted-foreground ml-1.5">— {n.message}</span>
            </div>
            <button
              onClick={() => setDismissed((prev) => new Set(prev).add(n.id))}
              className="shrink-0 p-0.5 rounded hover:bg-muted transition-colors"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
