import { useCallback } from "react";
import { getScopedCurrent, getScopedCurrentByEdgeBlock } from "../api/edges";
import { queryKeys } from "../api/queryKeys";
import { usePollingQuery } from "./usePollingQuery";

interface ScopedCurrentData {
  edgeIds: string[];
  tags: Array<{
    edge: string;
    tag: string;
    value: number | string | boolean | null;
    name?: string;
    min?: number;
    max?: number;
    comment?: string;
    unit_of_measurement?: string;
  }>;
  tagMeta?: Array<{
    id: string;
    name?: string;
    min?: number;
    max?: number;
    comment?: string;
    unit_of_measurement?: string;
  }>;
}

export const useScopedCurrent = (
  edgeId: string | null,
  refreshInterval = 1000,
  blockId?: string | null
) => {
  const useEdgeBlockQuery = Boolean(edgeId && blockId);
  const query = usePollingQuery<ScopedCurrentData | null>({
    queryKey: useEdgeBlockQuery
      ? queryKeys.current.scopedByEdgeBlock(edgeId as string, blockId as string)
      : edgeId
        ? queryKeys.current.scoped(edgeId)
        : ["current", "scoped", "empty"],
    enabled: Boolean(edgeId),
    queryFn: async () => {
      if (!edgeId) return null;
      if (blockId) {
        return getScopedCurrentByEdgeBlock(edgeId, blockId);
      }
      return getScopedCurrent(edgeId, true);
    },
    baseRefetchIntervalMs: refreshInterval,
  });

  const refresh = useCallback(async () => {
    await query.refetch();
  }, [query]);

  return {
    data: (query.data ?? null) as ScopedCurrentData | null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? "Ошибка загрузки данных блоков" : null,
    refresh,
  };
};