"use client";

import { LayoutList, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ViewToggleProps {
  mode: "list" | "grid";
  onChange: (mode: "list" | "grid") => void;
}

export function ViewToggle({ mode, onChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-lg border border-input bg-background p-0.5 gap-0.5">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange("list")}
        className={cn(
          "h-7 w-7 rounded-md",
          mode === "list"
            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Visualização em lista"
      >
        <LayoutList className="w-3.5 h-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onChange("grid")}
        className={cn(
          "h-7 w-7 rounded-md",
          mode === "grid"
            ? "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Visualização em cards"
      >
        <LayoutGrid className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}
