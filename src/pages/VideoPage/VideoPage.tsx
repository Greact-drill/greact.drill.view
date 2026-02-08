import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import Hls from "hls.js";
import { getMediaConfig, presignDownload } from "../../api/media";
import './VideoPage.css';

interface CameraConfig {
  id: string;
  name?: string;
  streamUrl?: string;
}

interface VideoConfigData {
  cameras?: CameraConfig[];
  assets?: MediaAsset[];
}

interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: 'image' | 'video' | 'document';
  url?: string;
  key?: string;
  contentType?: string;
}

export default function VideoPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [selectedCamera, setSelectedCamera] = useState("1");
  const [cameras, setCameras] = useState<CameraConfig[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [playbackStatus, setPlaybackStatus] = useState<"playing" | "loading" | "error" | "no-stream">("loading");
  const [streamResolution, setStreamResolution] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isActive = true;

    const normalizeCameras = (items?: CameraConfig[]) => {
      if (!Array.isArray(items)) return [];
      return items
        .map(camera => ({
          id: String(camera.id || '').trim(),
          name: camera.name?.trim() || '',
          streamUrl: camera.streamUrl?.trim() || ''
        }))
        .filter(camera => camera.id && camera.streamUrl);
    };

    const normalizeAssets = (items?: MediaAsset[]) => {
      if (!Array.isArray(items)) return [];
      return items
        .map(asset => ({
          id: String(asset.id || '').trim(),
          name: asset.name?.trim() || '',
          group: asset.group?.trim() || '',
          type: asset.type || 'document',
          url: asset.url?.trim() || '',
          key: asset.key,
          contentType: asset.contentType
        }))
        .filter(asset => asset.id && (asset.url || asset.key));
    };

    const loadConfig = async () => {
      try {
        const rigConfig = await getMediaConfig<VideoConfigData>('video', rigId);
        const rigCameras = normalizeCameras(rigConfig.data?.cameras);
        const rigAssets = normalizeAssets(rigConfig.data?.assets);
        if (rigCameras.length > 0) {
          if (isActive) {
            setCameras(rigCameras);
            setAssets(rigAssets);
          }
          return;
        }
        const globalConfig = await getMediaConfig<VideoConfigData>('video');
        const globalCameras = normalizeCameras(globalConfig.data?.cameras);
        const globalAssets = normalizeAssets(globalConfig.data?.assets);
        if (isActive) {
          setCameras(globalCameras);
          setAssets(globalAssets);
        }
      } catch {
        if (isActive) {
          setCameras([]);
          setAssets([]);
        }
      }
    };

    loadConfig();

    return () => {
      isActive = false;
    };
  }, [rigId]);

  useEffect(() => {
    if (!cameras.find(cam => cam.id === selectedCamera)) {
      setSelectedCamera(cameras[0]?.id || '');
    }
  }, [cameras, selectedCamera]);

  useEffect(() => {
    let isActive = true;
    const resolveAssets = async () => {
      if (assets.length === 0) return;
      if (assets.every(asset => asset.url || !asset.key)) return;
      const updated = await Promise.all(
        assets.map(async (asset) => {
          if (asset.url || !asset.key) return asset;
          try {
            const presign = await presignDownload({ key: asset.key, expiresIn: 3600 });
            return {
              ...asset,
              url: presign.url
            };
          } catch {
            return asset;
          }
        })
      );
      if (isActive) {
        setAssets(updated);
      }
    };
    resolveAssets();
    return () => {
      isActive = false;
    };
  }, [assets]);

  const groupedAssets = useMemo(() => {
    return assets.reduce(
      (acc, asset) => {
        const group = asset.group || 'Без группы';
        if (!acc[asset.type]) {
          acc[asset.type] = {};
        }
        if (!acc[asset.type][group]) {
          acc[asset.type][group] = [];
        }
        acc[asset.type][group].push(asset);
        return acc;
      },
      {
        image: {} as Record<string, MediaAsset[]>,
        video: {} as Record<string, MediaAsset[]>,
        document: {} as Record<string, MediaAsset[]>
      }
    );
  }, [assets]);

  const currentCamera = cameras.find(cam => cam.id === selectedCamera) || cameras[0] || null;
  const currentStreamUrl = currentCamera?.streamUrl?.trim();
  const streamHost = currentStreamUrl ? new URL(currentStreamUrl).host : "—";
  

  const statusLabel = (() => {
    if (playbackStatus === "no-stream") return "Нет потока";
    if (playbackStatus === "error") return "Ошибка";
    if (playbackStatus === "loading") return "Подключение";
    return "В сети";
  })();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setPlayerError(null);
    setPlaybackStatus("loading");
    setStreamResolution(null);

    if (!currentStreamUrl) {
      video.removeAttribute("src");
      video.load();
      setPlayerError("Для этой камеры нет доступного потока.");
      setPlaybackStatus("no-stream");
      return;
    }

    let hls: Hls | null = null;
    const handlePlaying = () => setPlaybackStatus("playing");
    const handleWaiting = () => setPlaybackStatus("loading");
    const handleError = () => setPlaybackStatus("error");
    const handleLoadedMetadata = () => {
      if (video.videoWidth && video.videoHeight) {
        setStreamResolution(`${video.videoWidth}x${video.videoHeight}`);
      }
    };

    video.addEventListener("playing", handlePlaying);
    video.addEventListener("waiting", handleWaiting);
    video.addEventListener("error", handleError);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = currentStreamUrl;
      video.play().catch(() => {
        setPlayerError("Не удалось запустить поток.");
        setPlaybackStatus("error");
      });
    } else if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: true
      });
      hls.loadSource(currentStreamUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          setPlayerError("Ошибка воспроизведения потока.");
          setPlaybackStatus("error");
          hls?.destroy();
        }
      });
    } else {
      setPlayerError("HLS не поддерживается этим браузером.");
      setPlaybackStatus("error");
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.removeEventListener("playing", handlePlaying);
      video.removeEventListener("waiting", handleWaiting);
      video.removeEventListener("error", handleError);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.pause();
      video.removeAttribute("src");
      video.load();
    };
  }, [currentStreamUrl]);

  return (
    <div className="video-page-container">
      {/* Заголовок страницы */}
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="video-page-title">Видеонаблюдение</h1>
          <p className="video-page-subtitle">Мониторинг в реальном времени</p>
        </div>
      </div>

      {/* Навигация */}
      <div className="video-page-nav">
        <Link to={`/rigs/${rigId}`} className="video-nav-link">
          <i className="pi pi-arrow-left" />
          <span>Назад</span>
        </Link>
      </div>

      {/* Основной контент */}
      <div className="video-content-wrapper">
        {/* Видео плеер */}
        <div className="video-player-section">
          <div className="video-player-container">
            <div className="video-player-wrapper">
              <div className="video-player-border-glow"></div>
              <video 
                ref={videoRef}
                className="video-player"
                controls
                controlsList="nodownload"
                preload="metadata"
                autoPlay
                playsInline
                muted
              >
                Ваш браузер не поддерживает видео.
              </video>
              <div className="video-player-overlay">
                <div className="video-player-info">
                  <div className="video-player-title-wrapper">
                  <div className="video-player-title">{currentCamera?.name || "Камера"}</div>
                    <div className="video-player-status-badge">
                      <i className="pi pi-circle-fill" />
                      <span>{statusLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {playerError && (
              <div className="video-player-error">
                {playerError}
              </div>
            )}
          </div>
        </div>

        {/* Боковая панель с информацией */}
        <aside className="video-info-panel">
          <div className="info-section">
            <h3 className="info-title">Информация</h3>
            <div className="video-info-list">
              <div className="info-row">
                <span className="info-label">Камера</span>
                <span className="info-value">{currentCamera?.name || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Статус</span>
                <span className={`info-value ${playbackStatus === "playing" ? "success" : ""}`}>
                  {playbackStatus === "playing" ? "✓ В сети" : statusLabel}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Источник</span>
                <span className="info-value">{streamHost}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Протокол</span>
                <span className="info-value">HLS</span>
              </div>
              <div className="info-row">
                <span className="info-label">Разрешение</span>
                <span className="info-value">{streamResolution ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-title">Камеры</h3>
            <div className="video-cameras-list">
              {cameras.map((camera) => (
                <div 
                  key={camera.id}
                  className={`video-camera-item ${selectedCamera === camera.id ? "active" : ""} ${camera.streamUrl ? "online" : "offline"}`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <div className="camera-icon-wrapper">
                    <div className="camera-icon">
                      <i className="pi pi-video" />
                    </div>
                    {camera.streamUrl && (
                      <div className="camera-status-indicator"></div>
                    )}
                  </div>
                  <div className="camera-info">
                    <div className="camera-name">{camera.name || camera.id}</div>
                    <div className={`camera-status ${camera.streamUrl ? "success" : ""}`}>
                      {camera.streamUrl ? "В сети" : "Офлайн"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-title">Изображения</h3>
            {assets.length === 0 && (
              <div className="video-assets-empty">Файлы не добавлены.</div>
            )}
            {assets.length > 0 && (
              <div className="video-assets-list">
                {Object.entries(groupedAssets.image).map(([group, items]) => (
                  <div key={`img-${group}`} className="video-assets-group">
                    <div className="video-assets-group-title">{group}</div>
                    <div className="video-assets-grid">
                      {items.map(asset => (
                        <div className="video-asset-item" key={asset.id}>
                          {asset.url ? (
                            <img src={asset.url} alt={asset.name || asset.id} className="video-asset-thumb" />
                          ) : (
                            <div className="video-asset-thumb placeholder">Нет превью</div>
                          )}
                          <div className="video-asset-info">
                            <div className="video-asset-name">{asset.name || asset.id}</div>
                            {asset.url && (
                              <a href={asset.url} target="_blank" rel="noreferrer" className="video-asset-link">
                                Открыть
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="info-section">
            <h3 className="info-title">Видео</h3>
            {Object.keys(groupedAssets.video).length === 0 && (
              <div className="video-assets-empty">Видео не добавлено.</div>
            )}
            {Object.entries(groupedAssets.video).map(([group, items]) => (
              <div key={`video-${group}`} className="video-assets-group">
                <div className="video-assets-group-title">{group}</div>
                <div className="video-assets-list">
                  {items.map(asset => (
                    <div className="video-asset-item video-asset-item--video" key={asset.id}>
                      {asset.url ? (
                        <video className="video-asset-video" src={asset.url} controls preload="metadata" />
                      ) : (
                        <div className="video-asset-video placeholder">Нет ссылки</div>
                      )}
                      <div className="video-asset-info">
                        <div className="video-asset-name">{asset.name || asset.id}</div>
                        {asset.url && (
                          <a href={asset.url} target="_blank" rel="noreferrer" className="video-asset-link">
                            Открыть
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="info-section">
            <h3 className="info-title">Документы</h3>
            {Object.keys(groupedAssets.document).length === 0 && (
              <div className="video-assets-empty">Документы не добавлены.</div>
            )}
            {Object.entries(groupedAssets.document).map(([group, items]) => (
              <div key={`doc-${group}`} className="video-assets-group">
                <div className="video-assets-group-title">{group}</div>
                <div className="video-assets-list">
                  {items.map(asset => (
                    <div className="video-asset-item" key={asset.id}>
                      <div className="video-asset-thumb placeholder">DOC</div>
                      <div className="video-asset-info">
                        <div className="video-asset-name">{asset.name || asset.id}</div>
                        {asset.url ? (
                          <a href={asset.url} target="_blank" rel="noreferrer" className="video-asset-link">
                            Открыть
                          </a>
                        ) : (
                          <span className="video-asset-link">Нет ссылки</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}