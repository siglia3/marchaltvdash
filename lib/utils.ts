import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeText(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function isAtivoValue(value: string | null | undefined) {
  return normalizeText(value) === "sim";
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return `${value.toFixed(1).replace(".", ",")}%`;
}

export function formatMonths(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  return value.toFixed(1).replace(".", ",");
}

export function formatSignedPercent(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—";
  }

  const formatted = Math.abs(value).toFixed(1).replace(".", ",");
  return `${value >= 0 ? "+" : "-"}${formatted}%`;
}

export function getChurnColor(value: number | null | undefined) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "text-slate-100";
  }

  if (value < 8) return "text-success";
  if (value <= 12) return "text-warning";
  return "text-danger";
}
