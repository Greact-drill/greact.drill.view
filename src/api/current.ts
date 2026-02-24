import { apiClient } from './client';
import { currentDetailsSchema } from "./schemas/criticalSchemas";
import { parseWithSchema } from "./schemas/validators";

export interface CurrentTagData {
  tag: string;
  value: number | string | boolean | null;
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
  return parseWithSchema(currentDetailsSchema, response.data, "getCurrentDetails", []);
}
