import { useState, useEffect, useRef } from 'react';
import { getTableConfigByPage, type TableConfigWithData } from '../api/tableConfigs';

export function useTableConfigByPage(page: string | null) {
  const [tableConfig, setTableConfig] = useState<TableConfigWithData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isFirstLoadRef = useRef(true);

  useEffect(() => {
    if (!page) {
      setTableConfig(null);
      isFirstLoadRef.current = true;
      return;
    }

    const fetchConfig = async () => {
      try {
        // Показываем loading только при первой загрузке
        if (isFirstLoadRef.current) {
          setLoading(true);
        }
        setError(null);
        
        const config = await getTableConfigByPage(page);
        setTableConfig(config);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки конфигурации таблицы');
        setTableConfig(null);
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
    fetchConfig();

    // Polling каждые 2 секунды
    const intervalId = setInterval(fetchConfig, 2000);

    // Очистка интервала при размонтировании или изменении page
    return () => {
      clearInterval(intervalId);
    };
  }, [page]);

  return { tableConfig, loading, error };
}
