"use client";

import { useState, useEffect } from "react";

type ViewMode = "list" | "grid";

export function useViewMode(key: string, defaultMode: ViewMode = "list") {
  const storageKey = `viewMode:${key}`;
  const [mode, setModeState] = useState<ViewMode>(defaultMode);

  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    if (stored === "list" || stored === "grid") setModeState(stored);
  }, [storageKey]);

  function setMode(newMode: ViewMode) {
    setModeState(newMode);
    localStorage.setItem(storageKey, newMode);
  }

  return { mode, setMode };
}
