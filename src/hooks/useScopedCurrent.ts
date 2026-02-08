import { useState, useEffect, useCallback } from 'react';
import { getScopedCurrent } from '../api/edges';

interface ScopedCurrentData {
  edgeIds: string[];
  tags: Array<{
    edge: string;
    tag: string;
    value: number;
    name?: string;
    min?: number;
    max?: number;
    comment?: string;
    unit_of_measurement?: string;
  }>;
  tagMeta?: Array<{
    id: string;
    name?: string;
    min?: number;
    max?: number;
    comment?: string;
    unit_of_measurement?: string;
  }>;
}

export const useScopedCurrent = (edgeId: string | null, refreshInterval = 1000) => {
  const [data, setData] = useState<ScopedCurrentData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!edgeId) {
      setData(null);
      return;
    }

    try {
      setLoading(true);
      const result = await getScopedCurrent(edgeId, true);
      setData(result);
      setError(null);
    } catch (err) {
      console.error('Ошибка загрузки scoped current:', err);
      setError('Ошибка загрузки данных блоков');
    } finally {
      setLoading(false);
    }
  }, [edgeId]);

  useEffect(() => {
    if (!edgeId) {
      setData(null);
      return;
    }

    // Первоначальная загрузка
    fetchData();

    // Настраиваем интервал обновления
    const intervalId = setInterval(fetchData, refreshInterval);

    // Очистка интервала при размонтировании
    return () => {
      clearInterval(intervalId);
    };
  }, [edgeId, fetchData, refreshInterval]);

  return { data, loading, error, refresh: fetchData };
};