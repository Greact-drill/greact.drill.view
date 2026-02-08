import { apiClient } from './client';

export interface TagMetaItem {
  id: string;
  name?: string;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
}

export async function getAllTagsMeta(): Promise<TagMetaItem[]> {
  const response = await apiClient.get<TagMetaItem[]>('/tag');
  return Array.isArray(response.data) ? response.data : [];
}
