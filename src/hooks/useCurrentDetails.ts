import { useQuery } from "@tanstack/react-query";
import { getCurrentDetails, type CurrentDetailsData } from "../api/current";
import { queryKeys } from "../api/queryKeys";

/**
 * Хук для получения текущих данных тегов через /current/details с polling каждую секунду
 * @param edgeKey - ключ буровой установки (edgeKey или rigKey)
 * @returns Объект с данными тегов, статусом загрузки и ошибкой
 */
export function useCurrentDetails(edgeKey: string | null) {
  const query = useQuery({
    queryKey: edgeKey ? queryKeys.current.details(edgeKey) : ["current", "details", "empty"],
    enabled: Boolean(edgeKey),
    queryFn: () => getCurrentDetails(edgeKey as string),
    refetchInterval: 1000,
  });

  return {
    data: (query.data as CurrentDetailsData | undefined) ?? null,
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка загрузки данных тегов"
          : null,
  };
}
