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

export function compareChestNumbers(chestA?: string | null, chestB?: string | null): number {
  const a = (chestA || "").trim();
  const b = (chestB || "").trim();
  if (!a && !b) return 0;
  if (!a) return 1;
  if (!b) return -1;

  const matchA = a.match(/^([a-zA-Z\s_-]*)(\d+)?(.*)$/);
  const matchB = b.match(/^([a-zA-Z\s_-]*)(\d+)?(.*)$/);

  if (matchA && matchB && (matchA[2] || matchB[2])) {
    const prefixA = matchA[1].replace(/[\s_-]/g, "").toUpperCase();
    const prefixB = matchB[1].replace(/[\s_-]/g, "").toUpperCase();

    const prefixCmp = prefixA.localeCompare(prefixB);
    if (prefixCmp !== 0) return prefixCmp;

    const numA = matchA[2] ? parseInt(matchA[2], 10) : -1;
    const numB = matchB[2] ? parseInt(matchB[2], 10) : -1;

    if (numA !== numB) {
      if (numA === -1) return 1;
      if (numB === -1) return -1;
      return numA - numB;
    }

    const restA = matchA[3] || "";
    const restB = matchB[3] || "";
    const restCmp = restA.localeCompare(restB, undefined, { numeric: true, sensitivity: "base" });
    if (restCmp !== 0) return restCmp;
  }

  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

