"use client";

import { motion } from "framer-motion";
import { LucideIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  /** "empty": sem dados ainda (padrão) | "no-results": nenhum resultado nos filtros */
  variant?: "empty" | "no-results";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "empty",
}: EmptyStateProps) {
  const isNoResults = variant === "no-results";
  const DisplayIcon = Icon ?? (isNoResults ? SearchX : SearchX);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          isNoResults ? "bg-info/10" : "bg-muted"
        )}
      >
        <DisplayIcon
          className={cn("w-8 h-8", isNoResults ? "text-info" : "text-muted-foreground")}
        />
      </div>
      <h3 className="text-lg font-semibold tracking-tight mb-1">
        {title ?? (isNoResults ? "Nenhum resultado encontrado" : "Nenhum item ainda")}
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </motion.div>
  );
}
