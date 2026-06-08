import { formatNaira, formatPoints } from "@/lib/utils";

export function Money({ kobo, points, className }) {
  if (kobo !== undefined && kobo !== null) {
    return <span className={className}>{formatNaira(kobo)}</span>;
  }
  if (points !== undefined && points !== null) {
    return <span className={className}>{formatPoints(points)}</span>;
  }
  return null;
}
