import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useTagsData } from '../../hooks/useTagsData';
import type { TagData } from '../../types/tag';
import './BypassStatusPage.css';
import VerticalBar from '../../components/VerticalBar/VerticalBar';
import GaugeWidget from '../../components/Gauge/GaugeWidget';
import NumberDisplay from '../../components/NumberDisplay/NumberDisplay';
import BypassStatusBlock from '../../components/BypassStatusBlock/BypassStatusBlock';
import { formatNumberWithUnit } from '../../utils/formatters';

// Интерфейс для конфигурации виджета из JSON
interface WidgetConfig {
    page: 'KTU' | 'PUMPBLOCK' | 'ACCIDENT' | 'BYPASS';
    widgetType: 'gauge' | 'bar' | 'number' | 'status';
    position: { x: number; y: number };
    customLabel?: string;
}

type WidgetType = WidgetConfig['widgetType'];

// Обновленная структура для мемоизации
interface BypassWidgetConfig {
    key: string;
    type: 'gauge' | 'bar' | 'number' | 'status';
    label: string;
    value: number | string | boolean;
    max: number;
    unit: string;
    isOK?: boolean;
    position: { x: number; y: number };
}

// Функция для получения конфигурации виджета из кастомизации
const findWidgetConfig = (tag: TagData, page: 'KTU' | 'PUMPBLOCK' | 'ACCIDENT' | 'BYPASS'): WidgetConfig | null => {
    const configCustom = tag.customization?.find(item => item.key === 'widgetConfig');
    
    if (configCustom) {
        try {
            const config: WidgetConfig = JSON.parse(configCustom.value);
            
            if (config.page === page) {
                return config;
            }
        } catch (error) {
            console.error('Ошибка парсинга конфига виджета:', error, 'Строка:', configCustom.value);
        }
    } else {
        console.log(`Для тега ${tag.tag} не найден widgetConfig`);
    }
    return null;
};

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

const isTagValueOK = (tag: TagData, widgetType?: WidgetType): boolean => {
    const { value, min, max, unit_of_measurement } = tag;
    const minValue = typeof min === 'number' ? min : 0;
    const maxValue = typeof max === 'number' ? max : 100;
    const numericValue = parseNumericValue(value);

    if (widgetType === 'status' && numericValue !== null) {
        return numericValue >= minValue && numericValue <= maxValue;
    }

    if (unit_of_measurement !== 'bool' && numericValue !== null) {
        return numericValue >= minValue && numericValue <= maxValue;
    }

    const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
    if (isStatusTag) {
        return value === 1 || value === true || String(value).toLowerCase() === 'true';
    }
    return true;
};

const transformTagToWidgetConfig = (tag: TagData, page: 'KTU' | 'PUMPBLOCK' | 'ACCIDENT' | 'BYPASS'): BypassWidgetConfig | null => {
    const config = findWidgetConfig(tag, page);
    if (!config) return null;

    return {
        key: `${tag.tag}-${page}`,
        type: config.widgetType,
        label: config.customLabel || tag.name || tag.comment,
        value: tag.value ?? (tag.unit_of_measurement === 'bool' ? false : 0),
        max: tag.max,
        unit: tag.unit_of_measurement || '',
        isOK: isTagValueOK(tag, config.widgetType),
        position: config.position
    };
};

export default function BypassStatusPage() {
    const navigate = useNavigate();
    const params = useParams();
    const rigId = params.rigId;
    const edgeKey = `${rigId}`;

    const { tagData, error } = useTagsData(edgeKey);

    const bypassWidgetConfigs: BypassWidgetConfig[] = useMemo(() => {
        if (!tagData) {
            return [];
        }
        
        const widgetConfigs = tagData
            .map(tag => transformTagToWidgetConfig(tag, 'BYPASS'))
            .filter((config): config is BypassWidgetConfig => config !== null);

        const sorted = widgetConfigs.sort((a, b) => {
            const typeA = (a.type === 'gauge' || a.type === 'bar') ? 0 : 1;
            const typeB = (b.type === 'gauge' || b.type === 'bar') ? 0 : 1;
            
            if (typeA !== typeB) {
                return typeA - typeB;
            }
            return a.label.localeCompare(b.label);
        });

        return sorted;
        
    }, [tagData]);

    const renderWidget = (config: BypassWidgetConfig) => {
        const getWidgetDimensions = () => {
            switch (config.type) {
                case 'gauge':
                    return { width: 250, height: 250 };
                case 'bar':
                    return { width: 250, height: 500 };
                case 'number':
                case 'status':
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
                    const displayValue = formatNumberWithUnit(parseNumericValue(config.value), config.unit);
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
                            value={config.value as string} 
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
                className={`positioned-widget widget-${config.type}`} 
                key={config.key}
                style={positionStyle}
                data-widget-type={config.type}
                data-position-x={config.position.x}
                data-position-y={config.position.y}
            >
                {widgetContent}
            </div>
        );
    };

    if (error) {
        return <div className="error-message">Ошибка загрузки: {error}</div>;
    }

    return (
        <div className="bypass-page-container">
            <div className="bypass-page-inner">
                <div className="bypass-controls-header">
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
                <div className="bypass-content-block">
                    <h1 className="bypass-blocks-title">
                        Состояние оборудования
                    </h1>
                    <div className="bypass-blocks-grid positioned-grid">
                        {bypassWidgetConfigs.map(renderWidget)}
                        {bypassWidgetConfigs.length === 0 && (
                            <div className="empty-grid-message">
                                <i className="pi pi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                                <p>Нет настроенных виджетов для состояния оборудования</p>
                                <p className="text-sm">Настройте виджеты в админ-панели</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}