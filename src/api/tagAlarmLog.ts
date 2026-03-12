import { apiClient } from "./client";

export interface TagAlarmLogItem {
  id: number;
  edge_id: string;
  tag_id: string;
  tag_name: string;
  value: number;
  min_limit: number;
  max_limit: number;
  alarm_type: "min" | "max";
  unit_of_measurement: string;
  timestamp: string;
  createdAt: string;
}

export interface TagAlarmLogResponse {
  items: TagAlarmLogItem[];
  total: number;
}

export async function getTagAlarmLogByEdge(
  edgeId: string,
  limit = 100,
  offset = 0
): Promise<TagAlarmLogResponse> {
  const response = await apiClient.get<TagAlarmLogResponse>(
    `/tag-alarm-log/by-edge/${encodeURIComponent(edgeId)}`,
    { params: { limit, offset } }
  );
  return response.data;
}

export async function getTagAlarmLog(
  params?: { edge_id?: string; limit?: number; offset?: number }
): Promise<TagAlarmLogResponse> {
  const response = await apiClient.get<TagAlarmLogResponse>(
    "/tag-alarm-log",
    { params }
  );
  return response.data;
}
