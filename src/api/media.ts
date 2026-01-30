import axios from 'axios';

const mediaBaseUrl =
  import.meta.env.VITE_MEDIA_API_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3010';

const mediaClient = axios.create({
  baseURL: mediaBaseUrl,
  timeout: 15000
});

export interface MediaConfigResponse<T = Record<string, unknown>> {
  key: string;
  data: T | null;
}

export interface PresignDownloadResponse {
  url: string;
  key: string;
  method: 'GET';
  publicUrl?: string | null;
}

export async function getMediaConfig<T = Record<string, unknown>>(
  scope: string,
  rigId?: string
): Promise<MediaConfigResponse<T>> {
  const response = await mediaClient.get<MediaConfigResponse<T>>('/media/config', {
    params: {
      scope,
      rigId: rigId || undefined
    }
  });
  return response.data;
}

export async function presignDownload(params: {
  key: string;
  expiresIn?: number;
}): Promise<PresignDownloadResponse> {
  const response = await mediaClient.post<PresignDownloadResponse>('/media/presign-download', params);
  return response.data;
}

export function getMediaDownloadUrl(key: string, download?: boolean) {
  const url = new URL('/media/download', mediaBaseUrl);
  url.searchParams.set('key', key);
  if (download) {
    url.searchParams.set('download', '1');
  }
  return url.toString();
}
