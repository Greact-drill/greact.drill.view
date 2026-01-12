import { useState, useEffect } from 'react';
import { getEdges, getEdgeAttributes, getRootEdges } from '../api/edges';
import type { Edge, EdgeWithAttributes, RawEdgeAttributes } from '../types/edge';
import apiClient from '../api/client';

export function useEdges() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEdges = async () => {
      try {
        setLoading(true);
        setError(null);
        const edgesData = await getEdges();
        
        setEdges(edgesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке edges');
        
      } finally {
        setLoading(false);
      }
    };

    fetchEdges();
  }, []);

  return { edges, loading, error };
}

export function useEdgeWithAttributes(edgeKey: string | null) {
  const [edgeData, setEdgeData] = useState<EdgeWithAttributes | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!edgeKey) {
      setEdgeData(null);
      return;
    }

    const fetchEdgeData = async () => {
      try {
        setLoading(true);
        setError(null);

        const edgesData = await getEdges({ key: edgeKey });
        const attributesData: RawEdgeAttributes | null | undefined = await getEdgeAttributes({ edge: edgeKey }); 

        // Находим edge, который совпадает по id с edgeKey
        const edge = edgesData.find(e => e.id === edgeKey);
        
        if (edge) {
          const hasAttributes = attributesData && Object.keys(attributesData).length > 0;
          const attributes = hasAttributes ? attributesData : undefined;
          
          const result: EdgeWithAttributes = {
            ...edge,
            attributes
          };
          
          setEdgeData(result);
        } else {
          setEdgeData(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных edge');
        
      } finally {
        setLoading(false);
      }
    };

    fetchEdgeData();
  }, [edgeKey]);

  return { edgeData, loading, error };
}

export function useAllEdgesWithAttributes() {
  const [edgesWithAttributes, setEdgesWithAttributes] = useState<EdgeWithAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAllEdgesWithAttributes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем все edges
        const edgesData = await getEdges();

        if (edgesData.length === 0) {
          setEdgesWithAttributes([]);
          return;
        }

        const attributesPromises = edgesData.map(async (edge) => {
        const attributes = await getEdgeAttributes({ edge: edge.id });

        return {
            ...edge,
            attributes: attributes
          } as EdgeWithAttributes;
        });

        const result = await Promise.all(attributesPromises);
        
        setEdgesWithAttributes(result);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке всех edges с атрибутами');
        
      } finally {
        setLoading(false);
      }
    };

    fetchAllEdgesWithAttributes();
  }, []);

  return { edgesWithAttributes, loading, error };
}

export function useRootEdges() {
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRootEdges = async () => {
      try {
        setLoading(true);
        setError(null);
        const edgesData = await getRootEdges(); // Используем новую функцию
        setEdges(edgesData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке корневых edges');
      } finally {
        setLoading(false);
      }
    };

    fetchRootEdges();
  }, []);

  return { edges, loading, error };
}

export function useRootEdgesWithAttributes() {
  const [edgesWithAttributes, setEdgesWithAttributes] = useState<EdgeWithAttributes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRootEdgesWithAttributes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Получаем корневые edges
        const rootEdges = await getEdges();
        const rootEdgesOnly = rootEdges.filter(edge => !edge.parent_id); // Фильтруем только корневые
        
        if (rootEdgesOnly.length === 0) {
          setEdgesWithAttributes([]);
          return;
        }

        // Для каждого корневого edge получаем атрибуты
        const attributesPromises = rootEdgesOnly.map(async (edge) => {
          const attributes = await getEdgeAttributes({ edge: edge.id });
          return {
            ...edge,
            attributes: attributes
          } as EdgeWithAttributes;
        });

        const result = await Promise.all(attributesPromises);
        setEdgesWithAttributes(result);

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке корневых edges с атрибутами');
      } finally {
        setLoading(false);
      }
    };

    fetchRootEdgesWithAttributes();
  }, []);

  return { edgesWithAttributes, loading, error };
}

// Добавляем функцию для получения дочерних элементов
export async function getEdgeChildren(edgeKey: string): Promise<Edge[]> {
  const response = await apiClient.get<Edge[]>(`/edge/${edgeKey}/children`);
  return response.data;
}

// Хук для получения дочерних элементов
export function useEdgeChildren(edgeKey: string | null) {
  const [children, setChildren] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!edgeKey) {
      setChildren([]);
      return;
    }

    const fetchChildren = async () => {
      try {
        setLoading(true);
        setError(null);
        const childrenData = await getEdgeChildren(edgeKey);
        setChildren(childrenData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Ошибка при загрузке дочерних элементов');
      } finally {
        setLoading(false);
      }
    };

    fetchChildren();
  }, [edgeKey]);

  return { children, loading, error };
}