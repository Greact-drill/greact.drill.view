import { useQuery, type QueryKey, type UseQueryOptions } from "@tanstack/react-query";
import { useRealtimeRefresh } from "./useRealtimeRefresh";

type PollingQueryOptions<TQueryFnData, TError, TData, TQueryKey extends QueryKey> =
  Omit<UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>, "queryKey" | "queryFn"> & {
    queryKey: TQueryKey;
    queryFn: () => Promise<TQueryFnData>;
    baseRefetchIntervalMs?: number;
  };

export function usePollingQuery<
  TQueryFnData = unknown,
  TError = Error,
  TData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>({
  queryKey,
  queryFn,
  baseRefetchIntervalMs = 1000,
  enabled = true,
  ...rest
}: PollingQueryOptions<TQueryFnData, TError, TData, TQueryKey>) {
  const { isDocumentVisible } = useRealtimeRefresh();

  return useQuery({
    queryKey,
    queryFn,
    enabled: enabled && isDocumentVisible,
    retry: 2,
    staleTime: 5_000,
    refetchInterval: (query) => {
      const failureCount = query.state.fetchFailureCount ?? 0;
      const backoffMultiplier = Math.min(8, 2 ** failureCount);
      return baseRefetchIntervalMs * backoffMultiplier;
    },
    ...rest,
  });
}
