import { useState, useEffect } from 'react';
import type { TagHistoryList } from '../types/tag';

const BASE_API_URL = import.meta.env.VITE_API_URL; 
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
    const [tagHistoryData, setTagHistoryData] = useState<TagHistoryList | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            // При реальном времени не показываем лоадер при каждом обновлении
            if (!isRealTime) {
                setLoading(true);
            }
            setError(null);
            
            try {
                const response = await fetch(`${BASE_API_URL}/history/details?edge=${edge}`);

                if (!response.ok) {
                    throw new Error(`Ошибка HTTP: ${response.status} (${response.statusText})`);
                }

                const data: TagHistoryList = await response.json(); 
                
                const filteredData = data.filter(tag => tag.history && tag.history.length > 0);
                
                setTagHistoryData(filteredData);

            } catch (err) {
                if (err instanceof Error) {
                    setError(`Не удалось загрузить исторические данные: ${err.message}`);
                } else {
                    setError('Произошла неизвестная ошибка при загрузке данных.');
                }
            } finally {
                setLoading(false);
            }
        };

        // Запускаем немедленно при первом монтировании или изменении isRealTime
        fetchHistory();
        
        let intervalId: number | undefined; 

        // ЛОГИКА РЕАЛЬНОГО ВРЕМЕНИ (POLLING)
        if (isRealTime) {
            // setInterval в браузере возвращает число (number)
            intervalId = setInterval(fetchHistory, REFRESH_INTERVAL) as unknown as number; 
        }

        // Функция очистки: останавливаем интервал при размонтировании или смене режима
        return () => {
             if (intervalId) {
                 clearInterval(intervalId);
             }
        };
        
    }, [isRealTime]); // Хук перезапускается, когда меняется isRealTime

    return { tagHistoryData, loading, error };
};