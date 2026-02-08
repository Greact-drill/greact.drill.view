import { useMemo, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import drillSvg from "../assets/drillOld.png";
import { getRigById } from "../api/rigs";
import { useEdgeWithAttributes, useEdgeChildren } from "../hooks/useEdges";
import type { Rig } from "../types/rig";
import { polygonPercentToSvgPoints } from "../utils/polygonUtils";
import { transformRawAttributes } from "../utils/edgeUtils";
import { formatNumberWithUnit } from "../utils/formatters";
import type { EdgeAttribute, RawEdgeAttributes } from "../types/edge";
import './MainPage.css';

// Импортируем компоненты виджетов как в DynamicWidgetPage
import GaugeWidget from "../components/Gauge/GaugeWidget.tsx";
import VerticalBar from "../components/VerticalBar/VerticalBar";
import NumberDisplay from "../components/NumberDisplay/NumberDisplay";
import CompactTagDisplay from "../components/CompactTagDisplay/CompactTagDisplay";
import WidgetPlaceholder from "../components/WidgetPlaceholder/WidgetPlaceholder.tsx";
import StatusTagWidget from "../components/StatusTagWidget/StatusTagWidget";

// Используем хук для получения конфигураций по edge_id
import { useWidgetConfigsByEdge } from "../hooks/useWidgetConfigs";
import { useCurrentDetails } from "../hooks/useCurrentDetails";
import { useScopedCurrent } from '../hooks/useScopedCurrent';

// Типы виджетов (такие же как в DynamicWidgetPage)
type WidgetType = 'gauge' | 'bar' | 'number' | 'status' | 'compact' | 'card';

// Получаем значение переменной окружения для Vite
const branch = import.meta.env.VITE_BRANCH || import.meta.env.BRANCH || 'main';
const featureFlag = branch !== 'main';

interface DynamicWidgetConfig {
  edgeId?: string;
  key: string;
  type: WidgetType;
  label: string;
  value: number | string | boolean | null;
  defaultValue?: number | string | boolean;
  max: number;
  unit: string;
  isOK?: boolean;
  position: { x: number; y: number };
  displayType: 'widget' | 'compact' | 'card';
  isLoading?: boolean;
  hasData?: boolean;
}

const parseNumericValue = (value: number | string | boolean | null): number | null => {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.').trim();
    if (!normalized) {
      return null;
    }
    const parsed = Number(normalized);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

const parseBooleanValue = (value: number | string | boolean | null): boolean => {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'number') {
    return value === 1;
  }
  return String(value).toLowerCase() === 'true' || String(value) === '1';
};

const isTagValueOK = (
  value: number | string | boolean | null,
  min: number,
  max: number,
  unit: string,
  widgetType?: WidgetType
): boolean => {
  if (value === null || value === undefined) {
    return true; // Если данных нет, считаем OK
  }

  const numericValue = parseNumericValue(value);
  if (widgetType === 'status' && numericValue !== null) {
    return numericValue >= min && numericValue <= max;
  }

  if (unit !== 'bool' && numericValue !== null) {
    return numericValue >= min && numericValue <= max;
  }

  if (unit === 'bool') {
    return value === 1 || value === true || String(value).toLowerCase() === 'true';
  }

  return true;
};

const getDefaultValue = (widgetType: WidgetType, unit: string): any => {
  switch (widgetType) {
    case 'gauge':
    case 'bar':
      return 0;
    case 'number':
      return unit === 'bool' ? false : 0;
    case 'status':
      return 'Ожидание данных';
    default:
      return '--';
  }
};

// Сегменты заданы в процентах относительно размера изображения
const SEGMENTS = [
  { 
    id: "1", 
    name: "КТУ/КРУ", 
    href: "/ktu/:rigId", 
    polygon: "14.2% 73.1%, 25% 70.67%, 32.7% 73.99%, 32.9% 80.2%, 21.5% 83.2%, 14.5% 79.5%" 
  },
  { 
    id: "2",
    name: "Насосный блок",
    href: "/pumpblock/:rigId",
    polygon: "26.55% 70.4%, 35.999% 68.4%, 43.7% 71.1%, 43.8% 77%, 34.5% 79.6%, 34.2% 73.7%"
  },
  { 
    id: "3",
    name: "Циркуляционная система",
    href: "/",
    polygon: "37.2% 68.1%, 45% 66.4%, 53.3% 68.7%, 53.3% 74.3%, 45.1% 76.8%, 44.9% 70.8%"
  },
  { 
    id: "4",
    name: "Лебедочный блок",
    href: "/",
    polygon: "41.5% 64.99%, 60.5% 60.9%, 73.5% 63.7%, 79.2% 64.8%, 84.5% 66%, 66.5% 71.5%"
  }
];

export default function MainPage() {
  const params = useParams();
  const navigate = useNavigate();
  const rigId = params.rigId || "14820";
  const [rig, setRig] = useState<Rig | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Используем rigId как edge_key для получения данных
  const edgeKey = `${rigId}`;
  const { edgeData } = useEdgeWithAttributes(edgeKey);
  
  // Получаем дочерние элементы текущей буровой
  const { children: childEdges, loading: childrenLoading, error: childrenError } = useEdgeChildren(edgeKey);

  // Получаем атрибуты для отображения статистики
  const edgeAttributes: EdgeAttribute | null = useMemo(() => {
    if (!edgeData?.attributes) return null;
    return transformRawAttributes(edgeData.attributes as RawEdgeAttributes, edgeKey);
  }, [edgeData, edgeKey]);

  // Получаем конфигурации виджетов для этого edge (корневого уровня)
  const { widgetConfigs, loading: widgetsLoading, error: widgetsError } = useWidgetConfigsByEdge(edgeKey);
  const { data: currentDetailsData } = useCurrentDetails(rigId || null);
  const { data: scopedCurrentData } = useScopedCurrent(edgeKey, 1000); // Обновляем каждую секунду

   // Обновляем dynamicWidgetConfigs для работы с обновляемыми данными блоков
   const allWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    // Теги из виджетов edge (существующая логика)
    const edgeWidgets = (widgetConfigs || []).map(config => {
      const rawWidgetType = config.config.widgetType;
      const widgetType: WidgetType =
        rawWidgetType === 'compact' || rawWidgetType === 'card' ? 'number' : rawWidgetType;
      const displayType = config.config.displayType || 'widget';
      
      // Используем currentDetailsData для получения актуальных значений
      const currentValue = currentDetailsData?.find(td => td.tag === config.tag_id)?.value;
      const hasData = currentValue !== undefined && currentValue !== null;
      const value = hasData ? currentValue : getDefaultValue(widgetType, config.tag.unit_of_measurement);
      
      const isOK = isTagValueOK(
        value, 
        config.tag.min || 0, 
        config.tag.max || 100, 
        config.tag.unit_of_measurement,
        widgetType
      );

      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value: value,
        defaultValue: getDefaultValue(widgetType, config.tag.unit_of_measurement),
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || '',
        isOK,
        position: config.config.position || { x: 0, y: 0 },
        displayType,
        isLoading: false,
        hasData
      } as DynamicWidgetConfig;
    });

    // Теги из блоков (создаем как виджеты) с актуальными данными
    const blockWidgets = (scopedCurrentData?.tags || [])
      .filter(tag => tag.edge !== edgeKey) // Фильтруем теги, которые принадлежат дочерним элементам
      .map((tag, index) => {
        const hasData = tag.value !== null && tag.value !== undefined;
        const displayType = 'compact' as const;
        
        return {
          key: `block-${tag.edge}-${tag.tag}-${index}`,
          type: 'number' as WidgetType,
          label: tag.name || `Тег ${tag.tag}`,
          value: tag.value,
          defaultValue: 0,
          max: tag.max || 100,
          unit: tag.unit_of_measurement || '',
          isOK: hasData && 
                 (tag.min === undefined || tag.max === undefined || 
                  (tag.value >= tag.min && tag.value <= tag.max)),
          position: { x: 0, y: 0 }, // Не используется для статистики
          displayType,
          isLoading: false,
          hasData,
          source: 'block' as const,
          edgeId: tag.edge
        } as DynamicWidgetConfig;
      });

    return [...edgeWidgets, ...blockWidgets];
  }, [widgetConfigs, scopedCurrentData, currentDetailsData, edgeKey]);

  // Преобразуем конфигурации в динамические виджеты (аналогично DynamicWidgetPage)
  const dynamicWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    if (!widgetConfigs || widgetConfigs.length === 0) {
      return [];
    }

    const currentDetailsMap = new Map<string, number>();
    if (currentDetailsData) {
      currentDetailsData.forEach(tagData => {
        currentDetailsMap.set(tagData.tag, tagData.value);
      });
    }

    return widgetConfigs.map(config => {
      const rawWidgetType = config.config.widgetType;
      const widgetType: WidgetType =
        rawWidgetType === 'compact' || rawWidgetType === 'card' ? 'number' : rawWidgetType;
      const displayType = config.config.displayType || 'widget';
      
      // Приоритет: currentDetailsData, затем config.current
      const currentValueFromDetails = currentDetailsMap.get(config.tag_id);
      const currentValue = currentValueFromDetails !== undefined
        ? currentValueFromDetails
        : config.current?.value;
      const hasData = currentValue !== null && currentValue !== undefined;
      const value = hasData ? currentValue : getDefaultValue(widgetType, config.tag.unit_of_measurement);
      const defaultValue = config.tag.unit_of_measurement === 'bool' ? false : 0;
      
      const isOK = isTagValueOK(
        value, 
        config.tag.min || 0, 
        config.tag.max || 100, 
        config.tag.unit_of_measurement,
        widgetType
      );

      // Для главной страницы используем фиксированную позицию или grid
      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value: value,
        defaultValue: defaultValue,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || '',
        isOK,
        position: config.config.position || { x: 0, y: 0 }, // Позиция из конфига или по умолчанию
        displayType,
        isLoading: false,
        hasData
      };
    });
  }, [widgetConfigs, currentDetailsData]);

  // Обновляем статистику тегов с автообновлением
  const tagsStats = useMemo(() => {
    const edgeTags = allWidgetConfigs.filter(w => !w.key.startsWith('block-'));
    const blockTags = allWidgetConfigs.filter(w => w.key.startsWith('block-'));
    
    const edgeTagsCount = edgeTags.length;
    const blockTagsCount = blockTags.length;
    const totalTags = allWidgetConfigs.length;
    
    const tagsWithData = allWidgetConfigs.filter(w => w.hasData).length;
    const tagsWithErrors = allWidgetConfigs.filter(w => w.hasData && !w.isOK).length;
    const tagsOk = allWidgetConfigs.filter(w => w.hasData && w.isOK).length;

    // Подсчитываем количество уникальных блоков с тегами
    const uniqueBlockEdges = [...new Set(blockTags.map(t => t.edgeId))].length;

    // Теги с ошибками для отображения
    const errorTags = allWidgetConfigs
      .filter(w => w.hasData && !w.isOK)
      .map(w => {
        const source = w.key.startsWith('block-') ? 'block' : 'edge';
        let edgeName = '';
        
        // Получаем название блока
        if (source === 'block' && w.edgeId) {
          // Ищем название блока среди дочерних элементов
          const childEdge = childEdges.find(child => child.id === w.edgeId);
          edgeName = childEdge?.name || `Блок ${w.edgeId}`;
        } else if (source === 'edge') {
          edgeName = 'Буровая установка';
        }
        
        return {
          label: w.label,
          value: w.value,
          unit: w.unit,
          max: w.max,
          type: w.type,
          source,
          edgeName // Добавляем название блока
        };
      });

    return {
      totalTags,
      edgeTagsCount,
      blockTagsCount,
      tagsWithData,
      tagsWithErrors,
      tagsOk,
      errorTags,
      uniqueBlockEdges,
      hasBlockData: blockTagsCount > 0,
      lastUpdated: new Date().toLocaleTimeString() // Добавляем время последнего обновления
    };
  }, [allWidgetConfigs, childEdges]);

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
              compact={true}
            />
          );
        case 'number': {
          const numericValue = parseNumericValue(
            config.hasData ? (config.value as number | string | boolean | null) : (config.defaultValue ?? null)
          );
          const displayValue = formatNumberWithUnit(numericValue, config.unit);
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
              isOK={config.isOK ?? false}
              cardMode={true}
            />
          );
        default:
          console.warn('❌ Неизвестный тип виджета:', config.type);
          return null;
      }
    })();

    const stateClassName = config.type === 'status'
      ? ''
      : `${config.hasData && config.isOK === false ? 'widget-out-of-range' : ''} ${config.hasData && config.isOK === true ? 'widget-in-range' : ''}`;

    return (
      <div 
        className={`main-page-widget widget-${config.type} display-${config.displayType} ${config.hasData ? 'widget-has-data' : 'widget-no-data'} ${stateClassName}`} 
        key={config.key}
        data-widget-type={config.type}
        data-display-type={config.displayType}
        data-has-data={config.hasData}
      >
        {widgetContent}
      </div>
    );
  };

  const staticSegmentsWithStatus = useMemo(() => {
    return SEGMENTS.map(segment => {
      let status: 'ok' | 'error' | 'warning' = 'ok';
      if (segment.id === '2') {
        status = 'error';
      } else if (segment.id === '3') {
        status = 'warning';
      } else if (segment.id === '1') {
        status = 'ok';
      }
      return {
        ...segment,
        status,
        svgPoints: polygonPercentToSvgPoints(segment.polygon, 1010, 1024) 
      };
    }).filter(segment => segment.polygon);
  }, []);

  useEffect(() => {
    getRigById(rigId).then((r) => setRig(r ?? null));
  }, [rigId]);

  if (widgetsLoading) {
    return (
      <div className="main-page-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Загрузка виджетов...</p>
        </div>
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
            <div className="loading-message">Загрузка подсистем...</div>
          ) : childrenError ? (
            <div className="error-message">{childrenError}</div>
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
        <div className="map-section">
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
                xlinkHref={drillSvg}
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
                  className={`seg-polygon status-${segment.status} ${hovered === segment.id ? 'hovered' : ''}`}
                  onMouseEnter={() => setHovered(segment.id)}
                  onMouseLeave={() => setHovered(null)}
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
          <div className="parameters-section">
            <h2 className="section-title">Параметры</h2>
            {widgetsError && (
              <div className="error-message">
                <i className="pi pi-exclamation-triangle" />
                {widgetsError}
              </div>
            )}
            {dynamicWidgetConfigs.length > 0 ? (
              <div className="widgets-grid">
                {dynamicWidgetConfigs.map(renderWidget)}
              </div>
            ) : (
              <div className="empty-widgets">
                <i className="pi pi-info-circle" />
                <p>Нет настроенных виджетов</p>
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