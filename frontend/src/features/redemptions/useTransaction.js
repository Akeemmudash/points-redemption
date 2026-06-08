import { useQuery } from "@tanstack/react-query";
import { getRedemption } from "@/api/redemptions";

export function useTransaction(id, options = {}) {
  return useQuery({
    queryKey: ["transactions", "detail", id],
    queryFn: () => getRedemption(id),
    enabled: !!id,
    ...options,
  });
}
