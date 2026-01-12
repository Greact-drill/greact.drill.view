import { useState, useEffect, useRef } from 'react';
import { getCurrentDetails, type CurrentDetailsData } from '../api/current';

/**
 * Хук для получения текущих данных тегов через /current/details с polling каждую секунду
 * @param edgeKey - ключ буровой установки (edgeKey или rigKey)
 * @returns Объект с данными тегов, статусом загрузки и ошибкой
 */
export function useCurrentDetails(edgeKey: string | null) {
  const [data, setData] = useState<CurrentDetailsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!edgeKey) {
      setData(null);
      isFirstLoadRef.current = true;
      return;
    }

    const fetchData = async () => {
      try {
        // Показываем loading только при первой загрузке
        if (isFirstLoadRef.current) {
          setLoading(true);
        }
        setError(null);
        
        const result = await getCurrentDetails(edgeKey);
        setData(result);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки данных тегов');
      } finally {
        if (isFirstLoadRef.current) {
          setLoading(false);
          isFirstLoadRef.current = false;
        }
      }
    };

    // Сбрасываем флаг первой загрузки при смене edgeKey
    isFirstLoadRef.current = true;

    // Первая загрузка
    fetchData();

    // Polling каждую секунду
    const intervalId = setInterval(fetchData, 1000);

    // Очистка интервала при размонтировании или изменении edgeKey
    return () => {
      clearInterval(intervalId);
    };
  }, [edgeKey]);

  return { data, loading, error };
}
