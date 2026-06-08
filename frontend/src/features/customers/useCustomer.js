import { useQuery } from "@tanstack/react-query";
import { getCustomer } from "@/api/customers";

export function useCustomer(id) {
  return useQuery({
    queryKey: ["customers", "detail", id],
    queryFn: () => getCustomer(id),
    enabled: !!id && id !== "new",
  });
}
