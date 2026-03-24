"use client";

import { LayoutList, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  mode: "list" | "grid";
  onChange: (mode: "list" | "grid") => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-input bg-background p-0.5 gap-0.5">
      <button
        onClick={() => onChange("list")}
        className={cn(
          "rounded-md p-1.5 transition-colors",
          mode === "list"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Lista"
      >
        <LayoutList className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={() => onChange("grid")}
        className={cn(
          "rounded-md p-1.5 transition-colors",
          mode === "grid"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        title="Cards"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
