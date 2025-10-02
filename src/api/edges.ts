import { apiClient } from './client';
import type { Edge, RawEdgeAttributes } from '../types/edge';

export interface EdgeGetRequest {
  key?: string;
  name?: string;
}

export interface EdgeAttributesGetRequest {
  edge_key?: string;
  bypass_state?: string;
}

export async function getEdges(params: EdgeGetRequest = {}): Promise<Edge[]> {
  const response = await apiClient.get<Edge[]>('/edge', { params });
  return response.data;
}

export async function getEdgeAttributes(params: { edge: string }): Promise<RawEdgeAttributes> {
    const response = await apiClient.get<RawEdgeAttributes>('/current', { params });
    return response.data;
}

export async function getEdgeWithAttributes(edgeKey: string): Promise<RawEdgeAttributes | null> {
    try {
        const attributes = await getEdgeAttributes({ edge: edgeKey });

        const hasData = attributes && Object.keys(attributes).length > 0;
        
        return hasData ? attributes : null;
    } catch {
        return null;
    }
}