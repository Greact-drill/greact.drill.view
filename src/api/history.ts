import { apiClient } from "./client";
import type { TagHistoryList } from "../types/tag";
import { parseWithSchema } from "./schemas/validators";
import { tagHistoryListSchema } from "./schemas/criticalSchemas";

export async function getTagHistoryDetails(edge: string): Promise<TagHistoryList> {
  const response = await apiClient.get<TagHistoryList>("/history/details", {
    params: { edge },
  });
  return parseWithSchema(tagHistoryListSchema, response.data, "getTagHistoryDetails", []);
}
