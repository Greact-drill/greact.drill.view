import { useQuery } from "@tanstack/react-query";
import { getTagHistoryDetails } from "../api/history";
import type { TagHistoryList } from "../types/tag";
import { queryKeys } from "../api/queryKeys";

const REFRESH_INTERVAL = 3000;

interface UseTagHistoryResult {
    tagHistoryData: TagHistoryList | null;
    loading: boolean;
    error: string | null;
}

/**
 * Хук для получения исторических данных тегов с API.
 * @param isRealTime Если true, данные будут обновляться с интервалом.
 * @returns Объект с историческими данными, статусом загрузки и ошибкой.
 */
export const useTagHistory = (isRealTime: boolean, edge: string): UseTagHistoryResult => {
    const query = useQuery({
        queryKey: queryKeys.history.details(edge, isRealTime ? "realtime" : "single"),
        enabled: Boolean(edge),
        queryFn: async () => {
            const data = await getTagHistoryDetails(edge);
            return data.filter((tag) => tag.history && tag.history.length > 0);
        },
        refetchInterval: isRealTime ? REFRESH_INTERVAL : false,
    });

    return {
        tagHistoryData: (query.data as TagHistoryList | undefined) ?? null,
        loading: query.isPending,
        error: query.error instanceof Error
            ? `Не удалось загрузить исторические данные: ${query.error.message}`
            : query.error
                ? "Произошла неизвестная ошибка при загрузке данных."
                : null,
    };
};