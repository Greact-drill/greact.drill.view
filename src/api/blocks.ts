import { apiClient } from './client';
import type { EdgeBlock } from '../types/block';

export interface EdgeBlocksGetRequest {
  edge_id?: string;
  block_name?: string;
}

export interface BlockTagsGetRequest {
  tag?: string;
  edge_key?: string;
  block_name?: string;
}

export async function getEdgeBlocks(params: EdgeBlocksGetRequest = {}): Promise<EdgeBlock[]> {
  const response = await apiClient.get<EdgeBlock[]>('/block', { params });
  return response.data;
}