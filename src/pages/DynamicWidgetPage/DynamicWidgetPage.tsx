import { useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useWidgetConfigsByPage } from '../../hooks/useWidgetConfigs.ts';
import { useTableConfigByPage } from '../../hooks/useTableConfig.ts';
import { useCurrentDetails } from '../../hooks/useCurrentDetails.ts';
import './DynamicWidgetPage.css';
import VerticalBar from '../../components/VerticalBar/VerticalBar';
import GaugeWidget from '../../components/Gauge/GaugeWidget';
import NumberDisplay from '../../components/NumberDisplay/NumberDisplay';
import BypassStatusBlock from '../../components/BypassStatusBlock/BypassStatusBlock';
import CompactTagDisplay from '../../components/CompactTagDisplay/CompactTagDisplay';
import WidgetPlaceholder from '../../components/WidgetPlaceholder/WidgetPlaceholder.tsx';
import TableWidget from '../../components/TableWidget/TableWidget';

// Типы виджетов
type WidgetType = 'gauge' | 'bar' | 'number' | 'status' | 'compact' | 'card';

interface DynamicWidgetConfig {
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
    case 'compact':
    case 'card':
      return '--';
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
  
  const { widgetConfigs, error } = useWidgetConfigsByPage(pageType);
  const { tableConfig: tableConfigData } = useTableConfigByPage(pageType);
  
  // Опрашиваем /current/details по ключу главной буровой установки (rigId)
  const { data: currentDetailsData } = useCurrentDetails(rigId || null);

  // Обновляем данные таблицы на основе currentDetailsData
  const updatedTableConfigData = useMemo(() => {
    if (!tableConfigData || !currentDetailsData) {
      return tableConfigData;
    }

    // Создаем Map для быстрого поиска значений тегов
    const currentDetailsMap = new Map<string, number>();
    currentDetailsData.forEach(tagData => {
      currentDetailsMap.set(tagData.tag, tagData.value);
    });

    // Создаем обновленную копию config с обновленными данными
    const updatedData: typeof tableConfigData.data = {};
    
    for (let row = 0; row < tableConfigData.rows; row++) {
      updatedData[row] = {};
      for (let col = 0; col < tableConfigData.cols; col++) {
        const cell = tableConfigData.cells?.[row]?.[col];
        const existingCellData = tableConfigData.data?.[row]?.[col];
        
        if (cell && (cell.type === 'tag-number' || cell.type === 'tag-text') && cell.value) {
          const tagId = cell.value;
          const updatedValue = currentDetailsMap.get(tagId);
          
          if (updatedValue !== undefined && existingCellData) {
            // Обновляем значение, сохраняя остальные данные
            updatedData[row][col] = {
              ...existingCellData,
              value: updatedValue
            };
          } else {
            updatedData[row][col] = existingCellData || null;
          }
        } else {
          updatedData[row][col] = existingCellData || null;
        }
      }
    }

    return {
      ...tableConfigData,
      data: updatedData
    };
  }, [tableConfigData, currentDetailsData]);

  const dynamicWidgetConfigs: DynamicWidgetConfig[] = useMemo(() => {
    if (!widgetConfigs || widgetConfigs.length === 0) {
      return [];
    }
    
    // Создаем Map для быстрого поиска актуальных значений тегов
    const currentDetailsMap = new Map<string, number>();
    if (currentDetailsData) {
      currentDetailsData.forEach(tagData => {
        currentDetailsMap.set(tagData.tag, tagData.value);
      });
    }
    
    return widgetConfigs.map(config => {
      const widgetType = config.config.widgetType;
      const displayType = config.config.displayType || 'widget';
      
      // Приоритет: используем данные из currentDetailsData, если есть, иначе из config.current
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

      return {
        key: `${config.tag_id}-${config.config.page}`,
        type: widgetType,
        label: config.config.customLabel || config.tag.name || config.tag.comment,
        value: value,
        defaultValue: defaultValue,
        max: config.tag.max || 100,
        unit: config.tag.unit_of_measurement || '',
        isOK,
        position: config.config.position,
        displayType,
        isLoading: false,
        hasData
      };
    });
  }, [widgetConfigs, currentDetailsData]);

  const renderWidget = (config: DynamicWidgetConfig) => {
    const getWidgetDimensions = () => {
      switch (config.type) {
        case 'gauge':
          return { width: 250, height: 250 };
        case 'bar':
          return { width: 250, height: 500 };
        case 'number':
        case 'status':
        case 'compact':
        case 'card':
        default:
          return { width: 250, height: 250 };
      }
    };

    const dimensions = getWidgetDimensions();
    
    const positionStyle = {
      position: 'absolute' as const,
      left: `${config.position.x}px`,
      top: `${config.position.y}px`,
      width: `${dimensions.width}px`,
      height: `${dimensions.height}px`,
      zIndex: 10
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
        case 'number':
          const displayValue = config.hasData 
            ? `${config.value}${config.unit ? ` ${config.unit}` : ''}`
            : `${config.defaultValue}${config.unit ? ` ${config.unit}` : ''}`;
          return (
            <NumberDisplay 
              key={config.key} 
              label={config.label} 
              value={displayValue}
            />
          );
        case 'status':
          return (
            <BypassStatusBlock 
              key={config.key} 
              label={config.label} 
              value={config.hasData ? (config.value as string) : 'Ожидание данных'} 
              isOK={config.isOK ?? false} 
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

    return (
      <div 
        className={`positioned-widget widget-${config.type} display-${config.displayType} ${config.hasData ? 'widget-has-data' : 'widget-no-data'}`} 
        key={config.key}
        style={positionStyle}
        data-widget-type={config.type}
        data-display-type={config.displayType}
        data-has-data={config.hasData}
      >
        {widgetContent}
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
              {updatedTableConfigData && (
                <div className="table-widget-section">
                  <TableWidget config={updatedTableConfigData} />
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