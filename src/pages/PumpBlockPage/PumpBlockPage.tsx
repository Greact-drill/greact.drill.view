import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import pumpBlockImage from "../../assets/pumpblock.png";
import CompactTagDisplay from "../../components/CompactTagDisplay/CompactTagDisplay";
import { getMediaConfig, presignDownload } from "../../api/media";
import './PumpBlockPage.css';

interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: 'image' | 'video' | 'document';
  url?: string;
  key?: string;
  contentType?: string;
}

interface BlockMediaConfig {
  assets?: MediaAsset[];
}

// Блоки насосного блока с их позициями на изображении и связями
// Координаты в процентах относительно viewBox (1010x1024)
const PUMP_BLOCKS = [
  { 
    id: "1", 
    name: "Насос 1",
    // Точка соединения на блоке (на краю изображения, слева)
    blockX: 0, // Левый край изображения
    blockY: 30, // Примерная позиция первого насоса
    // Позиция блока параметров (в процентах от viewBox, слева от изображения)
    paramX: 0, // Левый край viewBox
    paramY: 20 // 20% от верха
  },
  { 
    id: "2",
    name: "Насос 2",
    blockX: 0, // Левый край изображения
    blockY: 50, // Примерная позиция второго насоса
    paramX: 0,
    paramY: 45
  },
  { 
    id: "3",
    name: "Насос 3",
    blockX: 100, // Правый край изображения
    blockY: 35, // Примерная позиция третьего насоса
    paramX: 100, // Правый край viewBox
    paramY: 25
  },
  { 
    id: "4",
    name: "Насос 4",
    blockX: 100, // Правый край изображения
    blockY: 55, // Примерная позиция четвертого насоса
    paramX: 100,
    paramY: 50
  }
];

export default function PumpBlockPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [imageUrl, setImageUrl] = useState<string>(pumpBlockImage);

  useEffect(() => {
    let isActive = true;

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
        .filter(asset => asset.id && asset.type === 'image' && (asset.url || asset.key));
    };

    const pickImage = (assets: MediaAsset[]) => {
      const preferred = assets.find(asset => asset.group === 'main' || asset.group === 'default');
      return preferred || assets[0];
    };

    const loadImage = async () => {
      try {
        const rigConfig = await getMediaConfig<BlockMediaConfig>('pump-block', rigId);
        const rigAssets = normalizeAssets(rigConfig.data?.assets);
        const selected = pickImage(rigAssets);
        if (selected) {
          if (selected.url) {
            if (isActive) setImageUrl(selected.url);
          } else if (selected.key) {
            const presign = await presignDownload({ key: selected.key, expiresIn: 3600 });
            if (isActive) setImageUrl(presign.url);
          }
          return;
        }

        const globalConfig = await getMediaConfig<BlockMediaConfig>('pump-block');
        const globalAssets = normalizeAssets(globalConfig.data?.assets);
        const globalSelected = pickImage(globalAssets);
        if (globalSelected) {
          if (globalSelected.url) {
            if (isActive) setImageUrl(globalSelected.url);
          } else if (globalSelected.key) {
            const presign = await presignDownload({ key: globalSelected.key, expiresIn: 3600 });
            if (isActive) setImageUrl(presign.url);
          }
        }
      } catch {
        // keep default image
      }
    };

    loadImage();

    return () => {
      isActive = false;
    };
  }, [rigId]);

  return (
    <div className="pump-block-page-container">
      {/* Заголовок */}
      <div className="page-header">
        <h1 className="page-title">
          Насосный блок
        </h1>
      </div>

      {/* Навигационное меню */}
      <div className="subsystems-menu-top">
        <div className="subsystems-menu-nav">
          <Link to={`/rigs/${rigId}`} className="nav-menu-link">
            <i className="pi pi-arrow-left" />
            <span>Назад</span>
          </Link>
        </div>
      </div>

      {/* Основной контент: Статистика | Карта | Параметры */}
      <div className="main-content-layout">
        {/* Левая панель - Статистика */}
        <aside className="left-panel">
          {/* Статистика блока */}
          <div className="info-section">
            <h3 className="info-title">Статистика</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Всего насосов</div>
                <div className="stat-value">{PUMP_BLOCKS.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Активных</div>
                <div className="stat-value success">{PUMP_BLOCKS.length}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Производительность</div>
                <div className="stat-value">450 л/мин</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Статус</div>
                <div className="stat-value success">Работает</div>
              </div>
            </div>
          </div>

          {/* Информация о блоке */}
          <div className="info-section">
            <h3 className="info-title">Информация</h3>
            <div className="rig-info">
              <div className="info-row">
                <span className="info-label">Тип</span>
                <span className="info-value">Насосный блок</span>
              </div>
              <div className="info-row">
                <span className="info-label">Состояние</span>
                <span className="info-value success">✓ Норма</span>
              </div>
              <div className="info-row">
                <span className="info-label">Насосов</span>
                <span className="info-value">{PUMP_BLOCKS.length}</span>
              </div>
            </div>
          </div>

          {/* Статусы оборудования */}
          <div className="info-section">
            <h3 className="info-title">Оборудование</h3>
            <div className="equipment-status">
              {PUMP_BLOCKS.map((pump) => (
                <div key={pump.id} className="status-row ok">
                  <i className="pi pi-check-circle" />
                  <span>{pump.name}: Активен</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Центральная часть - Карта с связями и блоками параметров */}
        <div className="map-section">
        <svg
          className="map-svg"
          viewBox="-250 0 1510 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* ClipPath для скругления краев (только для изображения) */}
            <clipPath id="pumpBlockRoundedCorners">
              <rect x="0" y="0" width="1010" height="1024" rx="24" ry="24" />
            </clipPath>
            
            {/* Фильтр для яркого свечения контура */}
            <filter id="pumpBlockGlowFilter" x="-30%" y="-30%" width="160%" height="160%">
              {/* Внешнее свечение */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="8" result="blurOuter" />
              <feColorMatrix 
                in="blurOuter" 
                type="matrix" 
                values="0 0 0 0 0.988235294
                        0 0 0 0 0.678431373
                        0 0 0 0 0.439215686
                        0 0 0 1.2 0" 
                result="glowOuter" 
              />
              
              {/* Внутреннее свечение */}
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blurInner" />
              <feColorMatrix 
                in="blurInner" 
                type="matrix" 
                values="0 0 0 0 1
                        0 0 0 0 0.8
                        0 0 0 0 0.5
                        0 0 0 1.5 0" 
                result="glowInner" 
              />
              
              <feMerge>
                <feMergeNode in="glowOuter" />
                <feMergeNode in="glowInner" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Градиент для контура */}
            <linearGradient id="pumpBlockBorderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#e8c9a0" stopOpacity="1" />
              <stop offset="50%" stopColor="#d4a574" stopOpacity="1" />
              <stop offset="100%" stopColor="#e8c9a0" stopOpacity="1" />
            </linearGradient>
            
            {/* Фильтр для свечения связей */}
            <filter id="pumpConnectionGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" result="blur" />
              <feColorMatrix 
                in="blur" 
                type="matrix" 
                values="0 0 0 0 0.988235294
                        0 0 0 0 0.678431373
                        0 0 0 0 0.439215686
                        0 0 0 0.8 0" 
              />
            </filter>
          </defs>
          
          {/* Изображение со скругленными краями */}
          <g clipPath="url(#pumpBlockRoundedCorners)">
            <image 
              xlinkHref={imageUrl} 
              x="0" 
              y="0" 
              width="1010" 
              height="1024" 
              preserveAspectRatio="xMidYMid meet"
            />
          </g>
          
          {/* Контур со свечением - поверх всего */}
          <rect 
            x="2" 
            y="2" 
            width="1006" 
            height="1020" 
            rx="24" 
            ry="24" 
            fill="none" 
            stroke="url(#pumpBlockBorderGradient)" 
            strokeWidth="4"
            filter="url(#pumpBlockGlowFilter)"
            opacity="1"
            style={{ pointerEvents: 'none' }}
          />
          
          {/* Связи от блоков к параметрам */}
          {PUMP_BLOCKS.map((block) => {
            // Координаты точки соединения на блоке (на краю изображения)
            const blockX = (block.blockX / 100) * 1010; // 0 или 1010
            const blockY = (block.blockY / 100) * 1024;
            // Координаты блока параметров (слева или справа от изображения)
            const paramX = block.paramX === 0 ? -200 : 1210; // Слева: -200, справа: 1210
            const paramY = (block.paramY / 100) * 1024;
            
            return (
              <line
                key={`connection-${block.id}`}
                x1={blockX}
                y1={blockY}
                x2={paramX}
                y2={paramY}
                className="pump-connection-line"
                stroke="rgba(212, 165, 116, 0.6)"
                strokeWidth="2"
                strokeDasharray="5,5"
                filter="url(#pumpConnectionGlow)"
              />
            );
          })}
          
          {/* Точки соединения на блоках (на краю изображения) */}
          {PUMP_BLOCKS.map((block) => {
            const blockX = (block.blockX / 100) * 1010;
            const blockY = (block.blockY / 100) * 1024;
            return (
              <circle
                key={`connection-point-${block.id}`}
                cx={blockX}
                cy={blockY}
                r="6"
                className="pump-connection-point"
                fill="var(--color-accent-secondary)"
                stroke="rgba(212, 165, 116, 0.8)"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Точки соединения на концах связей (у блоков параметров) */}
          {PUMP_BLOCKS.map((block) => {
            const paramX = block.paramX === 0 ? -200 : 1210;
            const paramY = (block.paramY / 100) * 1024;
            return (
              <circle
                key={`param-point-${block.id}`}
                cx={paramX}
                cy={paramY}
                r="5"
                className="pump-param-point"
                fill="rgba(212, 165, 116, 0.8)"
                stroke="var(--color-accent-secondary)"
                strokeWidth="2"
              />
            );
          })}
          
          {/* Блоки параметров (используем foreignObject для размещения внутри расширенного SVG) */}
          {PUMP_BLOCKS.map((block) => {
            const isLeft = block.paramX === 0;
            const paramX = isLeft ? -200 : 1210;
            const paramY = (block.paramY / 100) * 1024;
            
            return (
              <foreignObject
                key={`param-block-${block.id}`}
                x={paramX - 100} // Центрируем блок (ширина ~200px)
                y={paramY - 40} // Центрируем блок (высота ~80px)
                width="200"
                height="80"
                className="pump-param-block"
                xmlns="http://www.w3.org/1999/xhtml"
              >
                <div style={{ width: '100%', height: '100%' }}>
                  <CompactTagDisplay
                    label={block.name}
                    value="--"
                    unit=""
                    isOK={true}
                  />
                </div>
              </foreignObject>
            );
          })}
        </svg>
        </div>

        {/* Правая панель - Параметры */}
        <aside className="right-panel">
          {/* Основные параметры */}
          <div className="info-section">
            <h3 className="info-title">Основные параметры</h3>
            <div className="parameters-list">
              <div className="parameter-item">
                <div className="parameter-label">Давление на входе</div>
                <div className="parameter-value">2.5 бар</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Давление на выходе</div>
                <div className="parameter-value">8.5 бар</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Температура</div>
                <div className="parameter-value">38°C</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Расход</div>
                <div className="parameter-value">450 л/мин</div>
              </div>
            </div>
          </div>

          {/* Системные параметры */}
          <div className="info-section">
            <h3 className="info-title">Системные параметры</h3>
            <div className="parameters-list">
              <div className="parameter-item">
                <div className="parameter-label">Напряжение</div>
                <div className="parameter-value">380 В</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Ток</div>
                <div className="parameter-value">95 А</div>
              </div>
              <div className="parameter-item">
                <div className="parameter-label">Мощность</div>
                <div className="parameter-value">36.1 кВт</div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
