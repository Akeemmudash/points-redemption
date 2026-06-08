import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deactivateCustomer } from "@/api/customers";

export function useDeactivateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deactivateCustomer,
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", id] });
    },
  });
}
