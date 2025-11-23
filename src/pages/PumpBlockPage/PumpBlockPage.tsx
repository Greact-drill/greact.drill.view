import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useTagsData } from '../../hooks/useTagsData.ts'; 
import type { TagData } from '../../types/tag.ts'; 
import '../KtuPage/KtuPage.css'; 
import VerticalBar from '../../components/VerticalBar/VerticalBar.tsx'; 
import GaugeWidget from '../../components/Gauge/GaugeWidget.tsx'; 
import NumberDisplay from '../../components/NumberDisplay/NumberDisplay.tsx'; 
import BypassStatusBlock from '../../components/BypassStatusBlock/BypassStatusBlock.tsx';

// Интерфейс для конфигурации виджета из JSON
interface WidgetConfig {
    page: 'KTU' | 'PUMPBLOCK';
    widgetType: 'gauge' | 'bar' | 'number' | 'status';
    position: { x: number; y: number };
    customLabel?: string;
}

interface PumpBlockWidgetConfig {
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
const findWidgetConfig = (tag: TagData, page: 'KTU' | 'PUMPBLOCK'): WidgetConfig | null => {
    const configCustom = tag.customization?.find(item => item.key === 'widgetConfig');
    if (configCustom) {
        try {
            const config: WidgetConfig = JSON.parse(configCustom.value);
            if (config.page === page) {
                return config;
            }
        } catch (error) {
            console.error('Ошибка парсинга конфига виджета:', error);
        }
    }
    return null;
};

const isTagValueOK = (tag: TagData): boolean => {
    const { value, min, max, unit_of_measurement } = tag;

    // 1. Проверка числового диапазона
    if (unit_of_measurement !== 'bool' && typeof value === 'number') {
        return value >= min && value <= max;
    }

    // 2. Проверка статусного тега
    const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
    if (isStatusTag) {
        // Для статуса: True/1 считается OK
        return value === 1 || value === true;
    }

    return true;
};

const transformTagToWidgetConfig = (tag: TagData, page: 'KTU' | 'PUMPBLOCK'): PumpBlockWidgetConfig | null => {
    const config = findWidgetConfig(tag, page);
    if (!config) return null;

    return {
        key: tag.tag,
        type: config.widgetType,
        label: config.customLabel || tag.comment || tag.name,
        value: tag.value,
        max: tag.max,
        unit: tag.unit_of_measurement || '',
        isOK: isTagValueOK(tag),
        position: config.position
    };
};

export default function PumpBlockPage() {
    const navigate = useNavigate();
    const { tagData, error } = useTagsData(); 

    const pumpBlockWidgetConfigs: PumpBlockWidgetConfig[] = useMemo(() => {
        if (!tagData) return [];

        // Фильтруем теги, у которых есть конфигурация для страницы Насосного блока
        const widgetConfigs = tagData
            .map(tag => transformTagToWidgetConfig(tag, 'PUMPBLOCK'))
            .filter((config): config is PumpBlockWidgetConfig => config !== null);

        // Сортируем: сначала широкие виджеты (gauge, bar), потом компактные
        return widgetConfigs.sort((a, b) => {
            const typeA = (a.type === 'gauge' || a.type === 'bar') ? 0 : 1;
            const typeB = (b.type === 'gauge' || b.type === 'bar') ? 0 : 1;
            
            if (typeA !== typeB) {
                return typeA - typeB; // Сначала Gauges/Bars (широкие), потом остальные
            }

            // Если типы одинаковые, сортируем по метке для стабильного порядка
            return a.label.localeCompare(b.label);
        });
        
    }, [tagData]);

    const renderWidget = (config: PumpBlockWidgetConfig) => {
        // Определяем класс ширины в зависимости от типа виджета
        const widthClass = (config.type === 'gauge' || config.type === 'bar') 
                           ? 'widget-col-2' 
                           : 'widget-col-1';
        
        // Стиль для абсолютного позиционирования
        const positionStyle = {
            position: 'absolute' as const,
            left: `${config.position.x}px`,
            top: `${config.position.y}px`,
            zIndex: 10
        };

        const widgetContent = (() => {
            switch (config.type) {
                case 'status':
                    return (
                        <BypassStatusBlock 
                            key={config.key} 
                            label={config.label} 
                            value={config.value as string} 
                            isOK={config.isOK ?? false} 
                        />
                    );
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
                    const displayValue = `${config.value}${config.unit ? ` ${config.unit}` : ''}`;
                    return (
                        <NumberDisplay 
                            key={config.key} 
                            label={config.label} 
                            value={displayValue} 
                        />
                    );
                default:
                    return null;
            }
        })();

        return (
            <div 
                className={`positioned-widget ${widthClass}`} 
                key={config.key}
                style={positionStyle}
            >
                {widgetContent}
            </div>
        );
    };

    if (error || !tagData) {
        return <div className="error-message">Ошибка загрузки: {error || 'Нет данных для отображения.'}</div>;
    }
    
    return (
        <div className="ktu-page-container">
            <div className="ktu-page-inner">
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
                    <h1 className="ktu-blocks-title">
                        Параметры Насосного блока
                    </h1>
                    <div className="ktu-blocks-grid positioned-grid">
                        {pumpBlockWidgetConfigs.map(renderWidget)}
                        {pumpBlockWidgetConfigs.length === 0 && (
                            <div className="empty-grid-message">
                                <i className="pi pi-inbox" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
                                <p>Нет настроенных виджетов для Насосного блока</p>
                                <p className="text-sm">Настройте виджеты в админ-панели</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}