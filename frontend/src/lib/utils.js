import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const nairaFormatter = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  minimumFractionDigits: 2,
});

export function formatNaira(kobo) {
  return nairaFormatter.format(kobo / 100);
}

const pointsFormatter = new Intl.NumberFormat("en-NG");

export function formatPoints(n) {
  return `${pointsFormatter.format(n)} pts`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  return format(new Date(iso), "dd MMM yyyy, HH:mm");
}

export function formatRelativeDate(iso) {
  if (!iso) return "—";
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}
