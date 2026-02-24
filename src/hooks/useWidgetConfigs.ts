import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { getWidgetConfigsByEdge, getWidgetConfigsByPage, type WidgetConfigData } from "../api/widgetConfigs";

export function useWidgetConfigsByEdge(edgeId: string | null) {
  const query = useQuery({
    queryKey: edgeId ? queryKeys.widgets.byEdge(edgeId) : ["widgets", "byEdge", "empty"],
    enabled: Boolean(edgeId),
    queryFn: () => getWidgetConfigsByEdge(edgeId as string),
  });

  return {
    widgetConfigs: (query.data as WidgetConfigData[] | undefined) ?? [],
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка загрузки конфигураций виджетов"
          : null,
  };
}

export function useWidgetConfigsByPage(page: string | null) {
  const query = useQuery({
    queryKey: page ? queryKeys.widgets.byPage(page) : ["widgets", "byPage", "empty"],
    enabled: Boolean(page),
    queryFn: () => getWidgetConfigsByPage(page as string),
    refetchInterval: 2000,
  });

  return {
    widgetConfigs: (query.data as WidgetConfigData[] | undefined) ?? [],
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка загрузки конфигураций виджетов"
          : null,
  };
}