"use client";

import { forwardRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "type"> {
  value: number | string;
  onChange: (value: number) => void;
  className?: string;
}

/**
 * CurrencyInput — Masked BRL monetary input.
 * Always stores a raw number (in BRL). Displays formatted "1.234,56".
 * Works with React Hook Form via `onChange` + `value`.
 */
export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, className, ...props }, ref) => {
    // Format a raw number (e.g. 1234.56) to display string "1.234,56"
    const formatDisplay = (raw: number | string): string => {
      const num = typeof raw === "string" ? parseFloat(raw) || 0 : raw;
      return new Intl.NumberFormat("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(num);
    };

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip everything except digits
        const digits = e.target.value.replace(/\D/g, "");
        // Treat last 2 digits as cents
        const raw = parseInt(digits || "0", 10) / 100;
        onChange(raw);
      },
      [onChange]
    );

    return (
      <div className="relative">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={formatDisplay(value)}
          onChange={handleChange}
          className={cn("pl-8", className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";
