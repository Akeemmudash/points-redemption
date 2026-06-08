import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateCustomer } from "@/api/customers";

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCustomer,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers", "detail", variables.id] });
    },
  });
}
