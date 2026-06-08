import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createRedemption } from "@/api/redemptions";

export function useCreateRedemption() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createRedemption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["reports"] });
    },
  });
}
