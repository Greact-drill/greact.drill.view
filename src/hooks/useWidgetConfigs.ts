import { useState, useEffect, useRef } from 'react';
import { getWidgetConfigsByEdge, getWidgetConfigsByPage, type WidgetConfigData } from '../api/widgetConfigs';

export function useWidgetConfigsByEdge(edgeId: string | null) {
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfigData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!edgeId) {
      setWidgetConfigs([]);
      return;
    }

    const fetchConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const configs = await getWidgetConfigsByEdge(edgeId);
        setWidgetConfigs(configs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки конфигураций виджетов');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [edgeId]);

  return { widgetConfigs, loading, error };
}

export function useWidgetConfigsByPage(page: string | null) {
  const [widgetConfigs, setWidgetConfigs] = useState<WidgetConfigData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!page) {
      setWidgetConfigs([]);
      isFirstLoadRef.current = true;
      return;
    }

    const fetchConfigs = async () => {
      try {
        // Показываем loading только при первой загрузке
        if (isFirstLoadRef.current) {
          setLoading(true);
        }
        setError(null);
        
        const configs = await getWidgetConfigsByPage(page);
        setWidgetConfigs(configs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки конфигураций виджетов');
      } finally {
        if (isFirstLoadRef.current) {
          setLoading(false);
          isFirstLoadRef.current = false;
        }
      }
    };

    // Сбрасываем флаг первой загрузки при смене page
    isFirstLoadRef.current = true;

    // Первая загрузка
    fetchConfigs();

    // Polling каждые 2 секунды
    const intervalId = setInterval(fetchConfigs, 2000);

    // Очистка интервала при размонтировании или изменении page
    return () => {
      clearInterval(intervalId);
    };
  }, [page]);

  return { widgetConfigs, loading, error };
}