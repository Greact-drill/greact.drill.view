import { useQuery } from "@tanstack/react-query";
import { getTagAlarmLogByEdge } from "../api/tagAlarmLog";
import { queryKeys } from "../api/queryKeys";

export interface UseTagAlarmLogParams {
  page?: number;
  limit?: number;
  tag_name?: string;
  alarm_type?: string;
}

export function useTagAlarmLog(
  edgeId: string | undefined,
  params: UseTagAlarmLogParams = {}
) {
  const { page = 1, limit = 20, tag_name, alarm_type } = params;
  const offset = (page - 1) * limit;
  const filters = tag_name || alarm_type ? { tag_name, alarm_type } : undefined;

  const query = useQuery({
    queryKey: queryKeys.tagAlarmLog.byEdge(edgeId ?? "", page, limit, filters),
    enabled: Boolean(edgeId),
    queryFn: () =>
      getTagAlarmLogByEdge(edgeId!, { limit, offset, tag_name, alarm_type }),
  });

  return {
    data: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
