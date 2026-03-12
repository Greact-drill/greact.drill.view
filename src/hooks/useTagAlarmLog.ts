import { useQuery } from "@tanstack/react-query";
import { getTagAlarmLogByEdge } from "../api/tagAlarmLog";
import { queryKeys } from "../api/queryKeys";

export function useTagAlarmLog(edgeId: string | undefined, limit = 200) {
  const query = useQuery({
    queryKey: queryKeys.tagAlarmLog.byEdge(edgeId ?? ""),
    enabled: Boolean(edgeId),
    queryFn: () => getTagAlarmLogByEdge(edgeId!, limit),
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
