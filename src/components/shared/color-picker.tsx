"use client";

import { Input } from "@/components/ui/input";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function ColorPicker({ value, onChange, placeholder = "#075056" }: ColorPickerProps) {
  return (
    <div className="flex gap-2 items-center">
      <Input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-12 h-9 p-1 cursor-pointer"
        aria-label="Selecionar cor"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
