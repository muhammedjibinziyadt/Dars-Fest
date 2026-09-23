"use client";

import React, { useState } from "react";
import { Pipette } from "lucide-react";

interface ColorPickerInputProps {
  name?: string;
  defaultValue?: string;
  value?: string;
  onChange?: (color: string) => void;
  label?: string;
  className?: string;
}

const PRESET_COLORS = [
  { name: "Cyan", hex: "#0ea5e9" },
  { name: "Crimson", hex: "#d72638" },
  { name: "Royal Blue", hex: "#1e3a8a" },
  { name: "Violet", hex: "#7c3aed" },
  { name: "Gold", hex: "#f59e0b" },
  { name: "Emerald", hex: "#059669" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Rose", hex: "#ec4899" },
  { name: "Indigo", hex: "#4f46e5" },
  { name: "Teal", hex: "#0d9488" },
];

export function ColorPickerInput({
  name = "themeColor",
  defaultValue = "#0ea5e9",
  value: controlledValue,
  onChange,
  label = "Team Theme Color",
  className = "",
}: ColorPickerInputProps) {
  const [internalColor, setInternalColor] = useState(defaultValue || "#0ea5e9");
  const color = controlledValue !== undefined ? controlledValue : internalColor;

  const handleColorChange = (newColor: string) => {
    setInternalColor(newColor);
    onChange?.(newColor);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {label && (
        <label className="text-xs font-semibold uppercase tracking-wider text-white/70 block">
          {label}
        </label>
      )}

      {/* Main Color Picker Box */}
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2.5 backdrop-blur-sm transition-all focus-within:border-cyan-500/50">
        {/* Interactive Native Color Circle */}
        <label
          htmlFor={`${name}-native-input`}
          className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/20 shadow-md transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: color }}
          title="Click to open color palette"
        >
          <Pipette className="h-4 w-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] opacity-70 hover:opacity-100" />
          <input
            id={`${name}-native-input`}
            type="color"
            value={color.startsWith("#") && color.length === 7 ? color : "#0ea5e9"}
            onChange={(e) => handleColorChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        {/* Text Input with Hex Code */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            name={name}
            value={color}
            onChange={(e) => {
              const val = e.target.value;
              handleColorChange(val.startsWith("#") ? val : `#${val}`);
            }}
            placeholder="#0ea5e9"
            className="w-full bg-transparent font-mono text-sm uppercase tracking-wider text-white outline-none placeholder:text-white/30"
          />
        </div>

        {/* Live Preview Pill */}
        <div
          className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-white shadow-xs border border-white/10"
          style={{ backgroundColor: color }}
        >
          Preview
        </div>
      </div>

      {/* Quick Presets Palette */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] text-white/50 mr-1">Presets:</span>
        {PRESET_COLORS.map((preset) => {
          const isSelected = color.toLowerCase() === preset.hex.toLowerCase();
          return (
            <button
              key={preset.hex}
              type="button"
              onClick={() => handleColorChange(preset.hex)}
              className={`h-6 w-6 rounded-lg border transition-all hover:scale-110 ${
                isSelected
                  ? "border-white ring-2 ring-white/50 scale-110"
                  : "border-white/20 hover:border-white/60"
              }`}
              style={{ backgroundColor: preset.hex }}
              title={preset.name}
            />
          );
        })}
      </div>
    </div>
  );
}
