import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../api/queryKeys";
import { getCurrentDetails } from "../api/current";
import type { TagDataList } from "../types/tag";

interface UseTagsDataResult {
    tagData: TagDataList | null;
    loading: boolean;
    error: string | null;
}

/**
 * Хук для получения текущих данных тегов с API.
 * @returns Объект с данными тегов, статусом загрузки и ошибкой.
 */
export const useTagsData = (edge: string): UseTagsDataResult => {
    const query = useQuery({
        queryKey: queryKeys.current.tagsData(edge),
        queryFn: () => getCurrentDetails(edge),
        enabled: Boolean(edge),
        refetchInterval: 1000,
    });

    return {
        tagData: (query.data as TagDataList | undefined) ?? null,
        loading: query.isPending,
        error: query.error instanceof Error
            ? `Не удалось загрузить данные тегов: ${query.error.message}`
            : query.error
                ? "Произошла неизвестная ошибка при загрузке данных."
                : null,
    };
};