import { twMerge } from "tailwind-merge";

export function cn(
  ...classes: Array<string | undefined | null | false | Record<string, boolean>>
) {
  const merged = classes
    .flatMap((cls) => {
      if (!cls) return [];
      if (typeof cls === "string") return [cls];
      return Object.entries(cls)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key);
    })
    .join(" ")
    .trim();
  
  return twMerge(merged);
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function isValidImageUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("img/") ||
    trimmed.startsWith("assets/")
  );
}

export function getSafeImageUrl(url?: string | null, fallback = "/img/jury.webp"): string {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;
  if (
    trimmed.startsWith("/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:image/")
  ) {
    return trimmed;
  }
  if (trimmed.startsWith("img/") || trimmed.startsWith("assets/")) {
    return `/${trimmed}`;
  }
  return fallback;
}

