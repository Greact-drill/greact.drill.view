import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!page) {
      setWidgetConfigs([]);
      return;
    }

    const fetchConfigs = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const configs = await getWidgetConfigsByPage(page);
        setWidgetConfigs(configs);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка загрузки конфигураций виджетов');
      } finally {
        setLoading(false);
      }
    };

    fetchConfigs();
  }, [page]);

  return { widgetConfigs, loading, error };
}