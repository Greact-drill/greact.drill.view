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

interface PumpBlockWidgetConfig {
    key: string;
    type: 'gauge' | 'bar' | 'number' | 'status';
    label: string;
    value: number | string | boolean;
    max: number;
    unit: string;
    isOK?: boolean; 
}

/**
 * Ищет кастомизационный ключ в теге и проверяет его значение на 'true'.
 */
const findCustomizationKey = (tag: TagData, key: string): boolean => {
    return tag.customization?.some(item => 
        item.key === key && item.value === 'true'
    ) ?? false;
};

/**
 * Проверяет, находится ли значение тега в "нормальном" диапазоне (OK).
 */
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

/**
 * Преобразует TagData в PumpBlockWidgetConfig.
 */
const transformTagToWidgetConfig = (tag: TagData): PumpBlockWidgetConfig => {
    const type = findCustomizationKey(tag, 'isGauge') ? 'gauge' :
                 findCustomizationKey(tag, 'isStatus') ? 'status' :
                 findCustomizationKey(tag, 'isVerticalBar') ? 'bar' :
                 'number';

    return {
        key: tag.tag,
        type: type as PumpBlockWidgetConfig['type'],
        label: tag.name,
        value: tag.value,
        max: tag.max,
        unit: tag.unit_of_measurement || '',
        isOK: isTagValueOK(tag),
    };
};

export default function PumpBlockPage() {
    const navigate = useNavigate();
    const { tagData, error } = useTagsData(); 

    // const pumpBlockWidgetConfigs: PumpBlockWidgetConfig[] = useMemo(() => {
    //     if (!tagData) return [];

    //     const filteredTags = tagData.filter(tag => 
    //         findCustomizationKey(tag, 'PUMPBLOCK')
    //     );

    //     // Преобразование данных тегов в конфигурацию виджетов
    //     const configs: PumpBlockWidgetConfig[] = filteredTags.map(tag => {
    //         const label = tag.comment || tag.name;
    //         const unit = tag.unit_of_measurement || '';
    //         const isOK = isTagValueOK(tag);
    //         const key = tag.name;

    //         const numericValue = typeof tag.value === 'number' ? tag.value : (tag.value === true ? 1 : (tag.value === false ? 0 : 0));
            
    //         if (findCustomizationKey(tag, 'isDisplayBlock')) {
    //              const statusValue = typeof tag.value === 'boolean' 
    //                 ? (tag.value ? 'Работает' : 'Не работает') 
    //                 : String(tag.value);

    //             return {
    //                 key,
    //                 type: 'status',
    //                 label,
    //                 value: statusValue,
    //                 max: 1, // Не используется
    //                 unit: '', // Не используется
    //                 isOK,
    //             };
    //         }
            
    //         if (findCustomizationKey(tag, 'isVerticalBar')) {
    //             return {
    //                 key,
    //                 type: 'bar',
    //                 label,
    //                 value: numericValue,
    //                 max: tag.max,
    //                 unit,
    //             };
    //         }
            
    //         if (findCustomizationKey(tag, 'isGauge')) {
    //             return {
    //                 key,
    //                 type: 'gauge',
    //                 label,
    //                 value: numericValue,
    //                 max: tag.max,
    //                 unit,
    //             };
    //         }

    //         if (findCustomizationKey(tag, 'isNumber')) {
    //             return {
    //                 key,
    //                 type: 'number',
    //                 label,
    //                 value: numericValue.toFixed(2),
    //                 max: tag.max, // Не используется
    //                 unit,
    //             };
    //         }

    //         // Игнорируем теги, которые не имеют настройки виджета
    //         return null;
    //     }).filter(item => item !== null) as PumpBlockWidgetConfig[];
        
    //     return configs.sort((a, b) => a.label.localeCompare(b.label));

    // }, [tagData]);

    const pumpBlockWidgetConfigs: PumpBlockWidgetConfig[] = useMemo(() => {
        if (!tagData) return [];

        const filteredTags = tagData.filter(tag => 
            tag.customization?.some(c => c.key === 'PUMPBLOCK' && c.value === 'true')
        );
        
        // 💡 ИСПРАВЛЕНИЕ: Комбинированная сортировка на массиве TagData
        const sortedTags = filteredTags.sort((a, b) => {
            // 1. Сортировка по типу: Gauge/Bar (0) должны идти раньше, чем Status/Number (1)
            // Здесь a и b гарантированно имеют тип TagData, что исключает ошибку
            const typeA = findCustomizationKey(a, 'isGauge') || findCustomizationKey(a, 'isBar') ? 0 : 1;
            const typeB = findCustomizationKey(b, 'isGauge') || findCustomizationKey(b, 'isBar') ? 0 : 1;
            
            if (typeA !== typeB) {
                return typeA - typeB; // Сначала Gauges/Bars (широкие), потом остальные
            }

            // 2. Если типы одинаковые, сортируем по имени для стабильного порядка
            return a.name.localeCompare(b.name);
        });

        // ШАГ 3: ТРАНСФОРМАЦИЯ
        return sortedTags.map(transformTagToWidgetConfig);
        
    }, [tagData]);

    const renderWidget = (config: PumpBlockWidgetConfig) => {
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
                        <div className="ktu-blocks-grid">
                            {pumpBlockWidgetConfigs.map(renderWidget)} 
                        </div>
                    </div>
            </div>
        </div>
    );
}