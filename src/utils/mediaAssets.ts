import { presignDownload } from "../api/media";

export type MediaAssetType = "image" | "video" | "document";

export interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: MediaAssetType;
  url?: string;
  key?: string;
  contentType?: string;
}

interface NormalizeMediaAssetsOptions {
  allowedTypes?: MediaAssetType[];
}

export const normalizeMediaAssets = (
  items?: MediaAsset[],
  options: NormalizeMediaAssetsOptions = {}
): MediaAsset[] => {
  if (!Array.isArray(items)) {
    return [];
  }

  const { allowedTypes } = options;
  const hasTypeFilter = Array.isArray(allowedTypes) && allowedTypes.length > 0;

  return items
    .map((asset) => ({
      id: String(asset.id || "").trim(),
      name: asset.name?.trim() || "",
      group: asset.group?.trim() || "",
      type: asset.type || "document",
      url: asset.url?.trim() || "",
      key: asset.key,
      contentType: asset.contentType,
    }))
    .filter((asset) => {
      if (!asset.id || (!asset.url && !asset.key)) {
        return false;
      }
      if (!hasTypeFilter) {
        return true;
      }
      return allowedTypes.includes(asset.type);
    });
};

export const pickPreferredMediaAsset = (assets: MediaAsset[]): MediaAsset | null => {
  if (!assets.length) {
    return null;
  }
  const preferred = assets.find((asset) => asset.group === "main" || asset.group === "default");
  return preferred || assets[0];
};

export const resolveMediaAssetUrl = async (asset: MediaAsset): Promise<string | null> => {
  if (asset.url) {
    return asset.url;
  }
  if (!asset.key) {
    return null;
  }
  try {
    const presign = await presignDownload({ key: asset.key, expiresIn: 3600 });
    return presign.url;
  } catch {
    return null;
  }
};
