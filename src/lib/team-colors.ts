export interface TeamPalette {
  primary: string;
  secondary: string;
  gradient: string;
  light: string;
  glow: string;
  border: string;
  stroke: string;
}

const DEFAULT_PALETTES = [
  "#D72638",
  "#1E3A8A",
  "#7C3AED",
  "#059669",
  "#D97706",
  "#E11D48",
  "#0891B2",
  "#4F46E5",
];

export function parseHex(hex?: string): { r: number; g: number; b: number; clean: string } {
  if (!hex) return { r: 14, g: 165, b: 233, clean: "0ea5e9" };
  let clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(clean, 16);
  if (isNaN(num) || clean.length !== 6) {
    return { r: 14, g: 165, b: 233, clean: "0ea5e9" };
  }
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
    clean: clean.toLowerCase(),
  };
}

/**
 * Returns a complete, dynamic color palette derived from any hex color.
 * Works seamlessly with arbitrary user-defined colors as well as defaults.
 */
export function getTeamPalette(color?: string, fallbackIndex = 0): TeamPalette {
  let chosen = color?.trim();
  if (!chosen || !/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(chosen)) {
    chosen = DEFAULT_PALETTES[fallbackIndex % DEFAULT_PALETTES.length];
  }

  const { r, g, b, clean } = parseHex(chosen);
  const primary = `#${clean}`;

  // Darker shade for gradient end
  const factor = 0.75;
  const dr = Math.round(r * factor);
  const dg = Math.round(g * factor);
  const db = Math.round(b * factor);
  const secondary = `#${((1 << 24) + (dr << 16) + (dg << 8) + db).toString(16).slice(1)}`;

  return {
    primary,
    secondary,
    gradient: `linear-gradient(135deg, ${primary}, ${secondary})`,
    light: `rgba(${r}, ${g}, ${b}, 0.12)`,
    glow: `rgba(${r}, ${g}, ${b}, 0.35)`,
    border: `rgba(${r}, ${g}, ${b}, 0.25)`,
    stroke: secondary,
  };
}
