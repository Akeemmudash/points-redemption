import { useQuery } from "@tanstack/react-query";
import { getReportSummary } from "@/api/reports";

export function useReportSummary(params, options = {}) {
  return useQuery({
    queryKey: ["reports", "summary", params],
    queryFn: () => getReportSummary(params),
    ...options,
  });
}
