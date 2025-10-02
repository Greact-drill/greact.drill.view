import { useState, useEffect } from 'react';
import { getEdges, getEdgeAttributes } from '../api/edges';
import type { Edge, EdgeWithAttributes, RawEdgeAttributes } from '../types/edge';

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

        if (edgesData.length > 0) {
          const edge = edgesData[0];
          
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
