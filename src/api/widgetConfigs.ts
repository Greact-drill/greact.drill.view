import { apiClient } from './client';

export interface WidgetConfigData {
  id: number;
  edge_id: string;
  tag_id: string;
  config: {
    page: string;
    widgetType: 'gauge' | 'bar' | 'number' | 'status' | 'compact' | 'card';
    position: { x: number; y: number };
    customLabel?: string;
    displayType?: 'widget' | 'compact' | 'card';
  };
  tag: {
    id: string;
    name: string;
    comment: string;
    unit_of_measurement: string;
    min: number;
    max: number;
  };
  current: {
    value: number;
    updatedAt: string;
  } | null;
}

// Получение конфигураций виджетов по edge_id
export async function getWidgetConfigsByEdge(edgeId: string): Promise<WidgetConfigData[]> {
  const response = await apiClient.get<WidgetConfigData[]>(`/edge/${edgeId}/widget-configs`);
  return response.data;
}

// Получение конфигураций виджетов по странице
export async function getWidgetConfigsByPage(page: string): Promise<WidgetConfigData[]> {
  const response = await apiClient.get<WidgetConfigData[]>(`/edge/page/${page}/widget-configs`);
  return response.data;
}

// Получение всех конфигураций виджетов (для админки)
export async function getAllWidgetConfigs(): Promise<WidgetConfigData[]> {
  const response = await apiClient.get<WidgetConfigData[]>('/edge/widget-configs/all');
  return response.data;
}