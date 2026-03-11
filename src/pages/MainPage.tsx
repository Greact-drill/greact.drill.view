import { lazy, Suspense, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import drillSvg from "../assets/drillOld.png";
import { formatNumberWithUnit } from "../utils/formatters";
import {
  parseBooleanValue,
  parseNumericValue,
} from "../utils/widgetValue";
import './MainPage.css';

// Импортируем компоненты виджетов как в DynamicWidgetPage
import WidgetPlaceholder from "../components/WidgetPlaceholder/WidgetPlaceholder.tsx";
const GaugeWidget = lazy(() => import("../components/Gauge/GaugeWidget.tsx"));
const VerticalBar = lazy(() => import("../components/VerticalBar/VerticalBar"));
const NumberDisplay = lazy(() => import("../components/NumberDisplay/NumberDisplay"));
const CompactTagDisplay = lazy(() => import("../components/CompactTagDisplay/CompactTagDisplay"));
const StatusTagWidget = lazy(() => import("../components/StatusTagWidget/StatusTagWidget"));

import ErrorView from "../components/ErrorView/ErrorView";
import EmptyState from "../components/EmptyState/EmptyState";
import LoadingState from "../components/LoadingState/LoadingState";
import { useMainPageViewModel, type DynamicWidgetConfig } from "./useMainPageViewModel";
import { useTheme } from "../theme/useTheme";
import rigLightTheme from "../assets/rig_light_theme_without_background.png";

// Получаем значение переменной окружения для Vite
const branch = import.meta.env.VITE_BRANCH || import.meta.env.BRANCH || 'main';
const featureFlag = branch !== 'main';

export default function MainPage() {
  const { isLight } = useTheme();
  const params = useParams();
  const navigate = useNavigate();
  const rigId = params.rigId || "14820";
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);
  const {
    rig,
    edgeData,
    childEdges,
    childrenLoading,
    childrenError,
    edgeAttributes,
    widgetsLoading,
    widgetsError,
    dynamicWidgetConfigs,
    tagsStats,
    staticSegmentsWithStatus,
  } = useMainPageViewModel(rigId);
  const mapImage = isLight ? rigLightTheme : drillSvg;

  // Функция рендеринга виджета (аналогично DynamicWidgetPage)
  const renderWidget = (config: DynamicWidgetConfig) => {
    // Если данных нет, показываем placeholder
    if (!config.hasData) {
      return (
        <div 
          className={`main-page-widget widget-${config.type} display-${config.displayType} widget-no-data`} 
          key={config.key}
          data-widget-type={config.type}
          data-display-type={config.displayType}
        >
          <WidgetPlaceholder
            type={config.type}
            label={config.label}
            unit={config.unit}
          />
        </div>
      );
    }

    const widgetContent = (() => {
      switch (config.type) {
        case 'gauge':
          return (
            <GaugeWidget 
              key={config.key} 
              label={config.label} 
              value={config.value as number} 
              max={config.max} 
              unit={config.unit}
              precision={config.precision}
              compact={true} // Добавляем compact режим для главной страницы
            />
          );
        case 'bar':
          return (
            <VerticalBar
              key={config.key} 
              label={config.label} 
              value={config.value as number} 
              max={config.max}
              precision={config.precision}
              compact={true}
            />
          );
        case 'number': {
          const numericValue = parseNumericValue(
            config.hasData ? (config.value as number | string | boolean | null) : (config.defaultValue ?? null)
          );
          const displayValue = formatNumberWithUnit(numericValue, config.unit, config.precision);
          return (
            <NumberDisplay 
              key={config.key} 
              label={config.label} 
              value={displayValue}
              compact={true}
            />
          );
        }
        case 'status':
          return (
            <StatusTagWidget
              key={config.key}
              label={config.label}
              value={parseBooleanValue(config.value as number | string | boolean | null)}
            />
          );
        case 'compact':
          return (
            <CompactTagDisplay
              key={config.key}
              label={config.label}
              value={config.value}
              unit={config.unit}
              precision={config.precision}
              isOK={config.isOK ?? false}
            />
          );
        case 'card':
          return (
            <CompactTagDisplay
              key={config.key}
              label={config.label}
              value={config.value}
              unit={config.unit}
              precision={config.precision}
              isOK={config.isOK ?? false}
              cardMode={true}
            />
          );
        default:
          console.warn('❌ Неизвестный тип виджета:', config.type);
          return null;
      }
    })();

    const stateClassName = config.hasData && config.isOK === false
      ? 'widget-out-of-range'
      : config.hasData && config.isOK === true
        ? 'widget-in-range'
        : '';

    return (
      <div 
        className={`main-page-widget widget-${config.type} display-${config.displayType} ${config.hasData ? 'widget-has-data' : 'widget-no-data'} ${stateClassName}`} 
        key={config.key}
        data-widget-type={config.type}
        data-display-type={config.displayType}
        data-has-data={config.hasData}
      >
        <Suspense fallback={<WidgetPlaceholder type={config.type} label={config.label} unit={config.unit} />}>
          {widgetContent}
        </Suspense>
      </div>
    );
  };

  if (widgetsLoading) {
    return (
      <div className="main-page-container">
        <LoadingState message="Загрузка виджетов..." />
      </div>
    );
  }

  return (
    <div className="main-page-container">
      {/* Заголовок */}
      <div className="page-header">
        <h1 className="page-title">
          Буровая установка {rig?.name || edgeData?.name || `№${rigId}`}
        </h1>
      </div>

      {/* Меню подсистем над картой */}
      <div className="subsystems-menu-top">
        <div className="subsystems-menu-content">
          {childrenLoading ? (
            <LoadingState message="Загрузка подсистем..." />
          ) : childrenError ? (
            <ErrorView message={childrenError} onRetry={() => window.location.reload()} />
          ) : (
            <>
              {/* Статические кнопки */}
              {featureFlag && (
                <Link to={`/rigs/${rigId}/electrical-diagram`} className="subsystem-menu-item">
                  <i className="pi pi-sitemap" />
                  <span className="subsystem-menu-name">Схема электроснабжения</span>
                </Link>
              )}

              {featureFlag && (
                <Link to={`/rigs/${rigId}/winch-block`} className="subsystem-menu-item">
                  <i className="pi pi-wrench" />
                  <span className="subsystem-menu-name">Лебедочный блок</span>
                </Link>
              )}
              {featureFlag && (
                <Link to={`/rigs/${rigId}/pump-block`} className="subsystem-menu-item">
                  <i className="pi pi-cog" />
                  <span className="subsystem-menu-name">Насосный блок</span>
                </Link>
              )}
              {featureFlag && (
                <Link to={`/rigs/${rigId}/video`} className="subsystem-menu-item">
                  <i className="pi pi-video" />
                  <span className="subsystem-menu-name">Видеонаблюдение</span>
                </Link>
              )}
              <Link to={`/rigs/${rigId}/documents`} className="subsystem-menu-item">
                <i className="pi pi-file" />
                <span className="subsystem-menu-name">Документы</span>
              </Link>
              {featureFlag && (
                <Link to={`/rigs/${rigId}/power-consumption`} className="subsystem-menu-item">
                  <i className="pi pi-chart-bar" />
                  <span className="subsystem-menu-name">Расход электроэнергии</span>
                </Link>
              )}
              <Link to={`/rigs/${rigId}/archive`} className="subsystem-menu-item">
                <i className="pi pi-chart-line" />
                <span className="subsystem-menu-name">Архив</span>
              </Link>
              
              {/* Динамические кнопки подсистем */}
              {childEdges.length > 0 && childEdges.map((child) => (
                <button
                  key={child.id}
                  className="subsystem-menu-item"
                  onClick={() => navigate(`/rigs/${rigId}/widgets/${child.id}`, { state: { pageTitle: child.name || `Подсистема ${child.id}` } })}
                >
                  <span className="subsystem-menu-name">{child.name || `Подсистема ${child.id}`}</span>
                </button>
              ))}
              
              {/* Кнопка "Назад" */}
              <button onClick={() => navigate('/')} className="subsystem-menu-item">
                <i className="pi pi-arrow-left" />
                <span className="subsystem-menu-name">Назад</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Основной контент: Статистика | Карта | Параметры */}
      <div className="main-content-layout">
        {/* Левая панель - Статистика */}
        <aside className="left-panel">
          {/* Статистика тегов */}
          <div className="info-section">
            <h3 className="info-title">Статистика тегов
            </h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Всего</div>
                <div className="stat-value">{tagsStats.totalTags}</div>
                <div className="stat-sub">
                  <span className="stat-sub-item">Буровая: {tagsStats.edgeTagsCount}</span>
                  <span className="stat-sub-item">Блоки: {tagsStats.blockTagsCount}</span>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">С данными</div>
                <div className="stat-value">{tagsStats.tagsWithData}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">В норме</div>
                <div className="stat-value success">{tagsStats.tagsOk}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Ошибки</div>
                <div className="stat-value error">{tagsStats.tagsWithErrors}</div>
              </div>
              {tagsStats.hasBlockData && (
                <div className="stat-item">
                  <div className="stat-label">Активных блоков с тегами</div>
                  <div className="stat-value">{tagsStats.uniqueBlockEdges}</div>
                </div>
              )}
            </div>
          </div>

          {/* Информация о буровой */}
          {rig && (
            <div className="info-section">
              <h3 className="info-title">Установка</h3>
              <div className="rig-info">
                <div className="info-row">
                  <span className="info-label">ID</span>
                  <span className="info-value">#{rig.id}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Название</span>
                  <span className="info-value">{rig.name || '—'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Подсистем</span>
                  <span className="info-value">{childEdges.length}</span>
                </div>
              </div>
            </div>
          )}

          {/* Статусы оборудования */}
          {edgeAttributes && (
            <div className="info-section">
              <h3 className="info-title">Оборудование</h3>
              <div className="equipment-status">
                <div className={`status-row ${edgeAttributes.bypass_state === 'closed' ? 'ok' : 'error'}`}>
                  <i className="pi pi-lock" />
                  <span>Байпас: {edgeAttributes.bypass_state === 'closed' ? 'Закрыт' : 'Открыт'}</span>
                </div>
                <div className={`status-row ${edgeAttributes.drive_state === 'normal' ? 'ok' : 'error'}`}>
                  <i className="pi pi-cog" />
                  <span>Привод: {edgeAttributes.drive_state === 'normal' ? 'Норма' : 'Авария'}</span>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Центральная часть - Карта */}
        <div className="map-section map-section-animated">
          <svg
            className="map-svg"
            viewBox="0 0 1010 1024"
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              {/* ClipPath для скругления краев */}
              <clipPath id="roundedCorners">
                <rect x="0" y="0" width="1010" height="1024" rx="24" ry="24" />
              </clipPath>
              
              {/* Фильтр для яркого свечения контура */}
              <filter id="glowFilter" x="-30%" y="-30%" width="160%" height="160%">
                {/* Внешнее свечение - широкое и яркое */}
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
                
                {/* Внутреннее свечение - более интенсивное */}
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
              
              {/* Более яркий градиент для контура */}
              <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e8c9a0" stopOpacity="1" />
                <stop offset="50%" stopColor="#d4a574" stopOpacity="1" />
                <stop offset="100%" stopColor="#e8c9a0" stopOpacity="1" />
              </linearGradient>
            </defs>
            
            {/* Изображение со скругленными краями */}
            <g clipPath="url(#roundedCorners)">
              <image 
                xlinkHref={mapImage}
                x="0" 
                y="0" 
                width="1010" 
                height="1024"
                preserveAspectRatio="xMidYMid meet"
              />
            </g>
            
            {/* Интерактивные сегменты */}
            {staticSegmentsWithStatus.map((segment) => (
              segment.svgPoints && (
                <polygon
                  key={`static-${segment.id}`}
                  points={segment.svgPoints} 
                  className={`seg-polygon status-${segment.status} ${hoveredSegment === segment.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredSegment(segment.id)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              )
            ))}
            
            {/* Контур со свечением - толстый и яркий - должен быть поверх всего */}
            <rect 
              x="2" 
              y="2" 
              width="1006" 
              height="1020" 
              rx="24" 
              ry="24" 
              fill="none" 
              stroke="url(#borderGradient)" 
              strokeWidth="4"
              filter="url(#glowFilter)"
              opacity="1"
              style={{ pointerEvents: 'none' }}
            />
          </svg>
        </div>

        {/* Правая панель - Параметры */}
        <aside className="right-panel">
          <div className="info-section">
            <h3 className="info-title">Параметры</h3>
            {widgetsError && (
              <ErrorView message={widgetsError} onRetry={() => window.location.reload()} />
            )}
            {dynamicWidgetConfigs.length > 0 ? (
              <div className="widgets-grid">
                {dynamicWidgetConfigs.map(renderWidget)}
              </div>
            ) : (
              <div className="empty-widgets">
                <EmptyState message="Нет настроенных виджетов" />
              </div>
            )}
          </div>

          {/* Теги с ошибками */}
          {tagsStats.tagsWithErrors > 0 && (
            <div className="info-section error-section">
              <h3 className="info-title">Ошибки</h3>
              <div className="error-tags">
                {tagsStats.errorTags.map((tag, index) => (
                  <div key={index} className="error-tag">
                    <div className="error-tag-edge">{tag.edgeName}</div>
                    <div className="error-tag-name">{tag.label}</div>
                    <div className="error-tag-value">
                      {tag.value} {tag.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}