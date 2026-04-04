import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Radial gradient style for card accent — small soft circle near top-right corner */
export function radialGradient(color: "success" | "destructive" | "warning" | "primary"): React.CSSProperties {
  return {
    background: `radial-gradient(circle 120px at calc(100% - 16px) 16px, color-mix(in srgb, var(--${color}) 16%, transparent) 0%, transparent 100%), var(--card)`,
  };
}

import type React from "react";
