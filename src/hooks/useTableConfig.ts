import { useMemo, useRef } from "react";
import { getTableConfigByPage, type TableConfigWithData } from "../api/tableConfigs";
import { queryKeys } from "../api/queryKeys";
import { usePollingQuery } from "./usePollingQuery";

export function useTableConfigByPage(page: string | null) {
  const isFirstLoadRef = useRef(true);

  const query = usePollingQuery<TableConfigWithData | null>({
    queryKey: page ? queryKeys.tableConfig.byPage(page) : ["tableConfig", "byPage", "empty"],
    enabled: Boolean(page),
    queryFn: () => (page ? getTableConfigByPage(page) : Promise.resolve(null)),
    baseRefetchIntervalMs: 2000,
  });

  const loading = useMemo(() => {
    if (query.isSuccess || query.isError) {
      isFirstLoadRef.current = false;
    }
    return isFirstLoadRef.current ? query.isPending : false;
  }, [query.isSuccess, query.isError, query.isPending]);

  return {
    tableConfig: query.data ?? null,
    loading,
    error: query.error instanceof Error ? query.error.message : query.error ? "Ошибка загрузки конфигурации таблицы" : null,
  };
}
