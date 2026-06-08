import { useMutation, useQueryClient } from "@tanstack/react-query";
import { runReconciliation } from "@/api/reconciliation";

export function useReconcile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: runReconciliation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
