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

