import { useQuery } from "@tanstack/react-query";
import { getEdges, getEdgeAttributes, getRootEdges } from "../api/edges";
import { queryKeys } from "../api/queryKeys";
import type { Edge, EdgeWithAttributes } from "../types/edge";
import apiClient from '../api/client';

export function useEdges() {
  const query = useQuery({
    queryKey: queryKeys.edges.all,
    queryFn: () => getEdges(),
  });

  return {
    edges: query.data ?? [],
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? "Ошибка при загрузке edges" : null,
  };
}

export function useEdgeWithAttributes(edgeKey: string | null) {
  const query = useQuery({
    queryKey: edgeKey ? queryKeys.edges.byKey(edgeKey) : ["edges", "byKey", "empty"],
    enabled: Boolean(edgeKey),
    queryFn: async (): Promise<EdgeWithAttributes | null> => {
      if (!edgeKey) {
        return null;
      }
      const [edgesData, attributesData] = await Promise.all([
        getEdges({ key: edgeKey }),
        getEdgeAttributes({ edge: edgeKey }),
      ]);
      const edge = edgesData.find((e) => e.id === edgeKey);
      if (!edge) {
        return null;
      }
      const hasAttributes = attributesData && Object.keys(attributesData).length > 0;
      return {
        ...edge,
        attributes: hasAttributes ? attributesData : undefined,
      };
    },
  });

  return {
    edgeData: query.data ?? null,
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? "Ошибка при загрузке данных edge" : null,
  };
}

export function useAllEdgesWithAttributes() {
  const query = useQuery({
    queryKey: queryKeys.edges.withAttributes,
    queryFn: async (): Promise<EdgeWithAttributes[]> => {
      const edgesData = await getEdges();
      if (!edgesData.length) {
        return [];
      }
      return Promise.all(
        edgesData.map(async (edge) => ({
          ...edge,
          attributes: await getEdgeAttributes({ edge: edge.id }),
        }))
      );
    },
  });

  return {
    edgesWithAttributes: query.data ?? [],
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка при загрузке всех edges с атрибутами"
          : null,
  };
}

export function useRootEdges() {
  const query = useQuery({
    queryKey: queryKeys.edges.root,
    queryFn: () => getRootEdges(),
  });

  return {
    edges: query.data ?? [],
    loading: query.isPending,
    error: query.error instanceof Error ? query.error.message : query.error ? "Ошибка при загрузке корневых edges" : null,
  };
}

export function useRootEdgesWithAttributes() {
  const query = useQuery({
    queryKey: queryKeys.edges.rootWithAttributes,
    queryFn: async (): Promise<EdgeWithAttributes[]> => {
      const rootEdges = await getEdges();
      const rootEdgesOnly = rootEdges.filter((edge) => !edge.parent_id);
      if (!rootEdgesOnly.length) {
        return [];
      }
      return Promise.all(
        rootEdgesOnly.map(async (edge) => ({
          ...edge,
          attributes: await getEdgeAttributes({ edge: edge.id }),
        }))
      );
    },
  });

  return {
    edgesWithAttributes: query.data ?? [],
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка при загрузке корневых edges с атрибутами"
          : null,
  };
}

// Добавляем функцию для получения дочерних элементов
export async function getEdgeChildren(edgeKey: string): Promise<Edge[]> {
  const response = await apiClient.get<Edge[]>(`/edge/${edgeKey}/children`);
  return response.data;
}

// Хук для получения дочерних элементов
export function useEdgeChildren(edgeKey: string | null) {
  const query = useQuery({
    queryKey: edgeKey ? queryKeys.edges.children(edgeKey) : ["edges", "children", "empty"],
    enabled: Boolean(edgeKey),
    queryFn: () => getEdgeChildren(edgeKey as string),
  });

  return {
    children: query.data ?? [],
    loading: query.isPending,
    error:
      query.error instanceof Error
        ? query.error.message
        : query.error
          ? "Ошибка при загрузке дочерних элементов"
          : null,
  };
}