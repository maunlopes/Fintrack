"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/format";

interface MoneyValueProps {
  value: number;
  className?: string;
  animate?: boolean;
  colored?: boolean;
}

export function MoneyValue({ value, className, animate = true, colored = false }: MoneyValueProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!animate) {
      setDisplayValue(value);
      return;
    }
    const duration = 600;
    const startTime = performance.now();
    const startValue = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(startValue + (value - startValue) * eased);
      if (progress < 1) rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, animate]);

  return (
    <span
      className={cn(
        "money",
        colored && value >= 0 && "text-success",
        colored && value < 0 && "text-destructive",
        className
      )}
    >
      {formatCurrency(displayValue)}
    </span>
  );
}
