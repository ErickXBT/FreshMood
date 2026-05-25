import { useQueryClient } from "@tanstack/react-query";
import {
  useGetActiveCashier,
  getGetActiveCashierQueryKey,
  useActivateCashier,
  getListCashiersQueryKey,
} from "@workspace/api-client-react";

export function useActiveCashier() {
  const queryClient = useQueryClient();
  const { data: activeCashier, isLoading } = useGetActiveCashier({
    query: {
      queryKey: getGetActiveCashierQueryKey(),
      refetchInterval: 30_000,
    },
  });

  const activateMutation = useActivateCashier();

  const switchCashier = async (cashierId: number | null) => {
    await activateMutation.mutateAsync({ data: { cashierId } });
    queryClient.invalidateQueries({ queryKey: getGetActiveCashierQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListCashiersQueryKey() });
  };

  return {
    activeCashier: activeCashier ?? null,
    isLoading,
    switchCashier,
    isSwitching: activateMutation.isPending,
  };
}
