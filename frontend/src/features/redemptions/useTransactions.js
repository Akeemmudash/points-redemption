import { useQuery } from "@tanstack/react-query";
import { getRedemptions } from "@/api/redemptions";

export function useTransactions(params, options = {}) {
  return useQuery({
    queryKey: ["transactions", "list", params],
    queryFn: () => getRedemptions(params),
    ...options,
  });
}
