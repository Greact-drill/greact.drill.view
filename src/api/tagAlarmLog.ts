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

export interface TagAlarmLogParams {
  limit?: number;
  offset?: number;
  tag_name?: string;
  alarm_type?: string;
}

export async function getTagAlarmLogByEdge(
  edgeId: string,
  params: TagAlarmLogParams = {}
): Promise<TagAlarmLogResponse> {
  const { limit = 50, offset = 0, tag_name, alarm_type } = params;
  const response = await apiClient.get<TagAlarmLogResponse>(
    `/tag-alarm-log/by-edge/${encodeURIComponent(edgeId)}`,
    { params: { limit, offset, tag_name, alarm_type } }
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
