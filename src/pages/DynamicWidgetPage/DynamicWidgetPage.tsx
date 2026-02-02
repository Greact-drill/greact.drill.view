import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useWidgetConfigsByPage } from '../../hooks/useWidgetConfigs.ts';
import { useTableConfigByPage } from '../../hooks/useTableConfig.ts';
import { formatNumber, formatNumberWithUnit } from '../../utils/formatters';
import './DynamicWidgetPage.css';
import VerticalBar from '../../components/VerticalBar/VerticalBar';
import GaugeWidget from '../../components/Gauge/GaugeWidget';
import NumberDisplay from '../../components/NumberDisplay/NumberDisplay';
import CompactTagDisplay from '../../components/CompactTagDisplay/CompactTagDisplay';
import WidgetPlaceholder from '../../components/WidgetPlaceholder/WidgetPlaceholder.tsx';
import TableWidget from '../../components/TableWidget/TableWidget';
import StatusTagWidget from '../../components/StatusTagWidget/StatusTagWidget';

// Типы виджетов
type WidgetType = 'gauge' | 'bar' | 'number' | 'status' | 'compact' | 'card';

interface DynamicWidgetConfig {
  key: string;
  type: WidgetType;
  label: string;
  value: number | string | boolean | null;
  defaultValue?: number | string | boolean;
  min?: number | null;
  max: number;
  unit: string;
  comment?: string | null;
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

export default function DynamicWidgetPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  const pageType = params.pageType || '';
  const rigId = params.rigId || '';
  const configPage = (pageType === 'BYPASS' || pageType === 'ACCIDENT')
    ? `${pageType}_${rigId}`
    : pageType;
  
  const { widgetConfigs, error } = useWidgetConfigsByPage(configPage);
  const { tableConfig: tableConfigData } = useTableConfigByPage(configPage);
  
  const dynamicWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    if (!widgetConfigs || widgetConfigs.length === 0) {
      return [];
    }
    
    return widgetConfigs.map(config => {
      const rawWidgetType = config.config.widgetType;
      const widgetType: WidgetType =
        rawWidgetType === 'compact' || rawWidgetType === 'card' ? 'number' : rawWidgetType;
      const displayType = config.config.displayType || 'widget';
      
      const currentValue = config.current?.value;
      
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

      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value: value,
        defaultValue: defaultValue,
        min: config.tag.min ?? null,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || '',
        comment: config.tag.comment ?? null,
        isOK,
        position: config.config.position,
        displayType,
        isLoading: false,
        hasData
      };
    });
  }, [widgetConfigs]);

  const getMinMaxDisplay = (value: number | string | boolean | null | undefined) => {
    if (value === null || value === undefined) {
      return '—';
    }
    if (typeof value === 'number') {
      return formatNumber(value);
    }
    return String(value);
  };

  const renderWidget = (config: DynamicWidgetConfig) => {
    const getWidgetDimensions = () => {
      switch (config.type) {
        case 'gauge':
          return { width: 200, height: 200 };
        case 'bar':
          return { width: 200, height: 400 };
        case 'number':
        case 'status':
        case 'compact':
        case 'card':
        default:
          return { width: 200, height: 200 };
      }
    };

    const dimensions = getWidgetDimensions();
    
    const positionStyle = {
      position: 'absolute' as const,
      left: `${config.position.x}px`,
      top: `${config.position.y}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`
    };

    // Если данных нет, показываем placeholder с анимацией загрузки
    if (!config.hasData) {
      return (
        <div 
          className={`positioned-widget widget-${config.type} display-${config.displayType} widget-no-data`} 
          key={config.key}
          style={positionStyle}
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

    const statusValue = config.type === 'status'
      ? parseBooleanValue(config.value as number | string | boolean | null)
      : false;

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
            />
          );
        case 'bar':
          return (
            <VerticalBar
              key={config.key} 
              label={config.label} 
              value={config.value as number} 
              max={config.max} 
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
            />
          );
        }
        case 'status':
          return (
            <StatusTagWidget
              key={config.key}
              label={config.label}
              value={statusValue}
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
          // Используем CompactTagDisplay как временную замену для TagCard
          return (
            <CompactTagDisplay
              key={config.key}
              label={config.label}
              value={config.value}
              unit={config.unit}
              isOK={config.isOK ?? false}
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

    const tooltipStateClass = config.hasData
      ? (config.type === 'status'
        ? (statusValue ? 'widget-tooltip--ok' : 'widget-tooltip--error')
        : (config.isOK === true ? 'widget-tooltip--ok' : config.isOK === false ? 'widget-tooltip--error' : ''))
      : '';

    return (
      <div 
        className={`positioned-widget widget-${config.type} display-${config.displayType} ${config.hasData ? 'widget-has-data' : 'widget-no-data'} ${stateClassName}`} 
        key={config.key}
        style={positionStyle}
        data-widget-type={config.type}
        data-display-type={config.displayType}
        data-has-data={config.hasData}
      >
        {widgetContent}
        <div className={`widget-tooltip ${tooltipStateClass}`} role="tooltip">
          <div className="widget-tooltip-title">{config.label}</div>
          <div className="widget-tooltip-row">
            <span className="widget-tooltip-label">Мин</span>
            <span className="widget-tooltip-value">
              {getMinMaxDisplay(config.min)}{config.unit ? ` ${config.unit}` : ''}
            </span>
          </div>
          <div className="widget-tooltip-row">
            <span className="widget-tooltip-label">Макс</span>
            <span className="widget-tooltip-value">
              {getMinMaxDisplay(config.max)}{config.unit ? ` ${config.unit}` : ''}
            </span>
          </div>
          {config.comment && (
            <div className="widget-tooltip-comment">
              {config.comment}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Определяем тип страницы
  const isMainPage = pageType.startsWith('MAIN_');
  
  // Маппинг названий для известных типов страниц (fallback для прямых переходов)
  const getPageTitleByType = (type: string): string | null => {
    const titleMap: Record<string, string> = {
      'BYPASS': 'Байпас',
      'ACCIDENT': 'Аварии приводов',
      'KTU': 'КТУ',
      'PUMPBLOCK': 'Насосный блок',
      'Состояние байпасов': 'Байпас',
      'Аварии приводов': 'Аварии приводов',
    };
    return titleMap[type] || null;
  };
  
  // Получаем заголовок из state, если он был передан, иначе пытаемся найти по типу, иначе используем дефолтный
  const pageTitle = isMainPage 
    ? 'Главная страница' 
    : (location.state?.pageTitle as string) || getPageTitleByType(pageType) || 'Страница оборудования';

  if (error) {
    return <div className="error-message">Ошибка загрузки: {error}</div>;
  }

  return (
    <div className={`dynamic-widget-page-container ${isMainPage ? 'main-page' : 'widget-page'}`}>
      <div className="dynamic-widget-page-inner">
        <div className="dynamic-controls-header">
          <Button 
            icon="pi pi-arrow-left"
            label="Назад"
            severity="secondary"
            onClick={() => {
              navigate(-1); 
            }} 
            className="mb-4 back-button-custom"
          />
        </div>
        <div className="dynamic-content-block">
          <h1 className="dynamic-blocks-title">
            {pageTitle}
          </h1>
          
          {isMainPage ? (
            <div className="compact-tags-grid">
              {dynamicWidgetConfigs.map(renderWidget)}
              {dynamicWidgetConfigs.length === 0 && (
                <div className="empty-grid-message">
                  <i className="pi pi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                  <p>Нет настроенных виджетов для главной страницы</p>
                  <p className="text-sm">Настройте виджеты в админ-панели</p>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Отображение таблицы, если она настроена */}
              {tableConfigData && (
                <div className="table-widget-section">
                  <TableWidget config={tableConfigData} />
                </div>
              )}
              
              {/* Отображение виджетов */}
              <div className="dynamic-blocks-grid positioned-grid">
                {dynamicWidgetConfigs.map(renderWidget)}
                {dynamicWidgetConfigs.length === 0 && !tableConfigData && (
                  <div className="empty-grid-message">
                    <i className="pi pi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                    <p>Нет настроенных виджетов для этой страницы</p>
                    <p className="text-sm">Настройте виджеты в админ-панели</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}