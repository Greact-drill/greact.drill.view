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

export async function getRootEdges(): Promise<Edge[]> {
  const response = await apiClient.get<Edge[]>('/edge/roots');
  return response.data;
}

export interface ScopedCurrentTag {
  edge: string;
  tag: string;
  value: number;
  name?: string;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
}

export interface ScopedTagMeta {
  id: string;
  name?: string;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
}

export async function getScopedCurrent(edgeId: string, includeChildren: boolean = true): Promise<{ edgeIds: string[]; tags: ScopedCurrentTag[]; tagMeta?: ScopedTagMeta[] }> {
  const response = await apiClient.get<{ edgeIds: string[]; tags: ScopedCurrentTag[]; tagMeta?: ScopedTagMeta[] }>(`/edge/${edgeId}/scoped-current`, {
    params: { includeChildren }
  });
  return response.data;
}

export async function getCurrentByTags(edgeId: string, tagIds: string[], includeChildren: boolean = true): Promise<{ edgeIds: string[]; tags: ScopedCurrentTag[]; tagMeta?: ScopedTagMeta[] }> {
  const response = await apiClient.post<{ edgeIds: string[]; tags: ScopedCurrentTag[]; tagMeta?: ScopedTagMeta[] }>(`/edge/${edgeId}/current-by-tags`, {
    tagIds,
    includeChildren
  });
  return response.data;
}

export interface EdgeCustomization {
  edge_id: string;
  key: string;
  value: string;
}

export async function getEdgeCustomizations(edgeId: string): Promise<EdgeCustomization[]> {
  const response = await apiClient.get<EdgeCustomization[]>(`/edge-customization/${edgeId}`);
  return response.data;
}