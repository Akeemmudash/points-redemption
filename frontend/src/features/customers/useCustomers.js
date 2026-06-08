import { useQuery } from "@tanstack/react-query";
import { getCustomers } from "@/api/customers";

export function useCustomers(params) {
  return useQuery({
    queryKey: ["customers", "list", params],
    queryFn: () => getCustomers(params),
  });
}
