import { useParams, Link } from "react-router-dom";
import { useState } from "react";
import rigVideo from "../../assets/rig.mp4";
import './VideoPage.css';

export default function VideoPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [selectedCamera, setSelectedCamera] = useState("1");

  const cameras = [
    { id: "1", name: "Камера 1", status: "online", resolution: "1920x1080", fps: 30 },
    { id: "2", name: "Камера 2", status: "online", resolution: "1920x1080", fps: 30 },
    { id: "3", name: "Камера 3", status: "offline", resolution: "1280x720", fps: 25 },
  ];

  const currentCamera = cameras.find(cam => cam.id === selectedCamera) || cameras[0];

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
                className="video-player"
                controls
                controlsList="nodownload"
                preload="metadata"
                autoPlay
                loop
                muted
              >
                <source src={rigVideo} type="video/mp4" />
                Ваш браузер не поддерживает видео.
              </video>
              <div className="video-player-overlay">
                <div className="video-player-info">
                  <div className="video-player-title-wrapper">
                    <div className="video-player-title">{currentCamera.name}</div>
                    <div className="video-player-status-badge">
                      <i className="pi pi-circle-fill" />
                      <span>{currentCamera.status === "online" ? "В сети" : "Офлайн"}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Боковая панель с информацией */}
        <aside className="video-info-panel">
          <div className="info-section">
            <h3 className="info-title">Информация</h3>
            <div className="video-info-list">
              <div className="info-row">
                <span className="info-label">Камера</span>
                <span className="info-value">{currentCamera.name}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Статус</span>
                <span className={`info-value ${currentCamera.status === "online" ? "success" : ""}`}>
                  {currentCamera.status === "online" ? "✓ В сети" : "✗ Офлайн"}
                </span>
              </div>
              <div className="info-row">
                <span className="info-label">Разрешение</span>
                <span className="info-value">{currentCamera.resolution}</span>
              </div>
              <div className="info-row">
                <span className="info-label">FPS</span>
                <span className="info-value">{currentCamera.fps}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 className="info-title">Камеры</h3>
            <div className="video-cameras-list">
              {cameras.map((camera) => (
                <div 
                  key={camera.id}
                  className={`video-camera-item ${selectedCamera === camera.id ? "active" : ""} ${camera.status === "online" ? "online" : "offline"}`}
                  onClick={() => setSelectedCamera(camera.id)}
                >
                  <div className="camera-icon-wrapper">
                    <div className="camera-icon">
                      <i className="pi pi-video" />
                    </div>
                    {camera.status === "online" && (
                      <div className="camera-status-indicator"></div>
                    )}
                  </div>
                  <div className="camera-info">
                    <div className="camera-name">{camera.name}</div>
                    <div className={`camera-status ${camera.status === "online" ? "success" : ""}`}>
                      {camera.status === "online" ? "В сети" : "Офлайн"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}