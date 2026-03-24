"use client";

import { useEffect, useState } from "react";
import { Sparkles, AlertTriangle, Lightbulb, CheckCircle2, Info, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useChatStore } from "./chat-store";

type InsightType = "warning" | "tip" | "success" | "info";

interface Insight {
  type: InsightType;
  title: string;
  text: string;
}

interface CacheEntry {
  insights: Insight[];
  generatedAt: string;
}

const CACHE_KEY_PREFIX = "insights:v1:";

const ICON_MAP: Record<InsightType, { icon: React.ElementType; color: string; bg: string }> = {
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10" },
  tip: { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10" },
  success: { icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
  info: { icon: Info, color: "text-muted-foreground", bg: "bg-muted" },
};

const PREFILL_MAP: Record<InsightType, (title: string) => string> = {
  warning: (title) => `Me explique mais sobre o alerta: "${title}"`,
  tip: (title) => `Como posso agir na dica: "${title}"?`,
  success: (title) => `Me conta mais sobre: "${title}"`,
  info: (title) => `Explique melhor a análise: "${title}"`,
};

function todayKey() {
  return CACHE_KEY_PREFIX + new Date().toISOString().slice(0, 10);
}

function readCache(): CacheEntry | null {
  try {
    const raw = localStorage.getItem(todayKey());
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!Array.isArray(parsed.insights)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry: CacheEntry) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(entry));
  } catch {
    // ignore storage errors
  }
}

export function InsightsCard() {
  const { open, openWithPrefill } = useChatStore();
  const [insights, setInsights] = useState<Insight[]>([]);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [status, setStatus] = useState<"loading" | "loaded" | "error" | "empty">("loading");

  async function fetchInsights(force = false) {
    setStatus("loading");

    if (!force) {
      const cached = readCache();
      if (cached) {
        setInsights(cached.insights);
        setGeneratedAt(cached.generatedAt);
        setStatus(cached.insights.length > 0 ? "loaded" : "empty");
        return;
      }
    }

    try {
      const res = await fetch("/api/ia/insights", { method: "POST" });
      if (!res.ok) throw new Error("request failed");
      const data = (await res.json()) as { insights: Insight[]; generatedAt: string; error?: string };
      const entry: CacheEntry = { insights: data.insights, generatedAt: data.generatedAt };
      writeCache(entry);
      setInsights(data.insights);
      setGeneratedAt(data.generatedAt);
      setStatus(data.insights.length > 0 ? "loaded" : "empty");
    } catch {
      setStatus("error");
    }
  }

  useEffect(() => {
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function formatTime(iso: string) {
    try {
      return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  }

  return (
    <Card>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-semibold flex-1">Análise FinBot</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => fetchInsights(true)}
            disabled={status === "loading"}
            title="Atualizar análise"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", status === "loading" && "animate-spin")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={open}
            title="Abrir FinBot"
          >
            <span className="text-xs font-bold">→</span>
          </Button>
        </div>

        {generatedAt && status === "loaded" && (
          <p className="text-xs text-muted-foreground mt-0.5 ml-6">
            Gerado às {formatTime(generatedAt)} · hoje
          </p>
        )}

        <Separator className="my-3" />

        {/* Loading */}
        {status === "loading" && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-start gap-3 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-1.5 pt-0.5">
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-2.5 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {status === "error" && (
          <div className="text-center py-2 space-y-2">
            <p className="text-sm text-muted-foreground">Não foi possível gerar análise.</p>
            <Button variant="outline" size="sm" onClick={() => fetchInsights(true)}>
              Tentar novamente
            </Button>
          </div>
        )}

        {/* Empty */}
        {status === "empty" && (
          <p className="text-sm text-muted-foreground text-center py-2">
            Adicione dados financeiros para receber análise.
          </p>
        )}

        {/* Insights */}
        {status === "loaded" && (
          <div className="divide-y divide-border">
            {insights.map((insight, i) => {
              const { icon: Icon, color, bg } = ICON_MAP[insight.type] ?? ICON_MAP.info;
              return (
                <button
                  key={i}
                  className="w-full text-left flex items-start gap-3 py-2.5 first:pt-0 last:pb-0 hover:opacity-80 transition-opacity"
                  onClick={() => openWithPrefill(PREFILL_MAP[insight.type]?.(insight.title) ?? insight.title)}
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", bg)}>
                    <Icon className={cn("w-4 h-4", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{insight.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{insight.text}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
