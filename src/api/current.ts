import { apiClient } from './client';

export interface CurrentTagData {
  tag: string;
  value: number;
  name?: string;
  min?: number;
  max?: number;
  comment?: string;
  unit_of_measurement?: string;
  customization?: Array<{
    key: string;
    value: string;
  }>;
}

export type CurrentDetailsData = CurrentTagData[];

// Получение данных тегов по edgeKey
export async function getCurrentDetails(edge: string): Promise<CurrentDetailsData> {
  const response = await apiClient.get<CurrentDetailsData>(`/current/details`, {
    params: { edge }
  });
  return response.data;
}
