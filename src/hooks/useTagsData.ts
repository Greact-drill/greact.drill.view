import { useState, useEffect } from 'react';
import type { TagDataList } from '../types/tag';

// Адрес API, который вы указали
const BASE_API_URL = import.meta.env.VITE_API_URL; 

// Добавляем конкретный путь и параметры
const API_URL = `${BASE_API_URL}/current/details?edge=test`;

interface UseTagsDataResult {
    tagData: TagDataList | null;
    loading: boolean;
    error: string | null;
}

/**
 * Хук для получения текущих данных тегов с API.
 * @returns Объект с данными тегов, статусом загрузки и ошибкой.
 */
export const useTagsData = (): UseTagsDataResult => {
    const [tagData, setTagData] = useState<TagDataList | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchTags = async () => {
            setLoading(true);
            setError(null);
            
            try {
                const response = await fetch(API_URL);

                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status}`);
                }

                // API возвращает массив TagData[]
                const data: TagDataList = await response.json(); 
                setTagData(data);

            } catch (err) {
                // Обработка ошибки
                if (err instanceof Error) {
                    setError(`Не удалось загрузить данные тегов: ${err.message}`);
                } else {
                    setError('Произошла неизвестная ошибка при загрузке данных.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchTags();
        
        // Опционально: добавьте интервал для обновления данных
        const intervalId = setInterval(fetchTags, 1000); // Обновлять каждые 15 секунд
        return () => clearInterval(intervalId); // Очистка при размонтировании
        
    }, []); // Пустой массив зависимостей означает, что хук выполнится один раз при монтировании

    return { tagData, loading, error };
};