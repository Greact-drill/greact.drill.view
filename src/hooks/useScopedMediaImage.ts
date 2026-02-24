import { useEffect, useState } from "react";
import { getMediaConfig } from "../api/media";
import {
  normalizeMediaAssets,
  pickPreferredMediaAsset,
  resolveMediaAssetUrl,
  type MediaAsset,
} from "../utils/mediaAssets";

interface ScopedAssetsConfig {
  assets?: MediaAsset[];
}

interface UseScopedMediaImageParams {
  scope: string;
  rigId?: string;
  fallbackUrl: string;
}

export const useScopedMediaImage = ({
  scope,
  rigId,
  fallbackUrl,
}: UseScopedMediaImageParams): string => {
  const [imageUrl, setImageUrl] = useState<string>(fallbackUrl);

  useEffect(() => {
    let isActive = true;
    setImageUrl(fallbackUrl);

    const loadImage = async () => {
      const tryResolveImage = async (assets?: MediaAsset[]) => {
        const imageAssets = normalizeMediaAssets(assets, { allowedTypes: ["image"] });
        const selected = pickPreferredMediaAsset(imageAssets);
        if (!selected) {
          return false;
        }
        const url = await resolveMediaAssetUrl(selected);
        if (isActive && url) {
          setImageUrl(url);
          return true;
        }
        return false;
      };

      try {
        const scopedConfig = await getMediaConfig<ScopedAssetsConfig>(scope, rigId);
        const hasScopedImage = await tryResolveImage(scopedConfig.data?.assets);
        if (hasScopedImage) {
          return;
        }

        const globalConfig = await getMediaConfig<ScopedAssetsConfig>(scope);
        await tryResolveImage(globalConfig.data?.assets);
      } catch {
        // Keep fallback image.
      }
    };

    loadImage();

    return () => {
      isActive = false;
    };
  }, [scope, rigId, fallbackUrl]);

  return imageUrl;
};
