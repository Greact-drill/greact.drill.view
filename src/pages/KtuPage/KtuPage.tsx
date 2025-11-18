import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from 'primereact/button';
import { useTagsData } from '../../hooks/useTagsData.ts'; 
import type { TagData } from '../../types/tag.ts'; 
import './KtuPage.css'; 
import VerticalBar from '../../components/VerticalBar/VerticalBar.tsx'; 
import GaugeWidget from '../../components/Gauge/GaugeWidget.tsx'; 
import NumberDisplay from '../../components/NumberDisplay/NumberDisplay.tsx'; 
import BypassStatusBlock from '../../components/BypassStatusBlock/BypassStatusBlock.tsx';

// 1. Определяем стабильную структуру для мемоизации
interface KtuWidgetConfig {
    key: string;
    type: 'gauge' | 'bar' | 'number' | 'status'; 
    label: string;
    value: number | string | boolean; 
    max: number;
    unit: string;
    isOK?: boolean; 
}

const findCustomizationKey = (tag: TagData, key: string): boolean => {
    return tag.customization?.some(item => 
        item.key === key && item.value === 'true'
    ) ?? false;
};

const isTagValueOK = (tag: TagData): boolean => {
    const { value, min, max, unit_of_measurement } = tag;

    if (unit_of_measurement !== 'bool' && typeof value === 'number') {
        // Для числовых тегов: норма, если в диапазоне [min, max]
        return value >= min && value <= max;
    }

    const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
    // Для статусов: True/1 = OK
    if (isStatusTag) {
        return value === 1 || value === true;
    }
    return true; // По умолчанию считаем ОК
};

const transformTagToWidgetConfig = (tag: TagData): KtuWidgetConfig => {
    const type = findCustomizationKey(tag, 'isGauge') ? 'gauge' :
                 findCustomizationKey(tag, 'isStatus') ? 'status' :
                 findCustomizationKey(tag, 'isVerticalBar') ? 'bar' :
                 'number';

    return {
        key: tag.tag,
        type: type as KtuWidgetConfig['type'],
        label: tag.name,
        value: tag.value,
        max: tag.max,
        unit: tag.unit_of_measurement || '',
        isOK: isTagValueOK(tag),
    };
};

export default function KtuPage() {
    const navigate = useNavigate();
    const { tagData, error } = useTagsData(); 

        const ktuWidgetConfigs: KtuWidgetConfig[] = useMemo(() => {
            if (!tagData) return [];
            
            const configs: KtuWidgetConfig[] = [];

            for (const tag of tagData) {
                
                const numericValue = typeof tag.value === 'number' ? tag.value : null;
                const key = tag.name;
                const label = tag.comment || tag.name;
                const unit = tag.unit_of_measurement || '';
                const max = tag.max ?? 100;
                
                let config: KtuWidgetConfig | null = null;

                // 4. Status Display (key=isDisplayBlock)
                if (findCustomizationKey(tag, 'isDisplayBlock')) { 
                    const isOK = isTagValueOK(tag);
                    // Форматируем значение: 'В НОРМЕ' или 'ОТКЛ.', если это boolean/0/1
                    const displayValue = tag.value === true || tag.value === 1 
                                        ? 'В НОРМЕ' 
                                        : tag.value === false || tag.value === 0
                                        ? 'ОТКЛ.'
                                        : tag.value.toString();
                    
                    config = { key, type: 'status', label, value: displayValue, max: 0, unit: '', isOK };

                } 
                // 1. Gauge Chart (key=isGauge)
                else if (findCustomizationKey(tag, 'isGauge')) { 
                    if (numericValue !== null) {
                        config = { key, type: 'gauge', label, value: numericValue, max, unit, isOK: true };
                    }
                } 
                // 2. Vertical Bar (key=isVerticalBar)
                else if (findCustomizationKey(tag, 'isVerticalBar')) { 
                    if (numericValue !== null) {
                        config = { key, type: 'bar', label, value: numericValue, max, unit, isOK: true };
                    }
                } 
                // 3. Number Display (key=isNumber)
                else if (findCustomizationKey(tag, 'isNumber')) { 
                    const val = numericValue !== null ? numericValue : 'Нет данных';
                    config = { key, type: 'number', label, value: val, max: 0, unit: '' };
                }
                
                if (config) {
                    configs.push(config);
                }
            }

        const filteredTags = tagData.filter(tag => 
            tag.customization?.some(c => c.key === 'KTU' && c.value === 'true')
        );

        // 2. Группируем: сначала все манометры/гистограммы, потом статусы/числа
        const sortedTags = filteredTags.sort((a, b) => {
            // 1. Сортировка по типу: Gauge/Bar (0) должны идти раньше, чем Status/Number (1)
            // Здесь a и b гарантированно имеют тип TagData
            const typeA = findCustomizationKey(a, 'isGauge') || findCustomizationKey(a, 'isBar') ? 0 : 1;
            const typeB = findCustomizationKey(b, 'isGauge') || findCustomizationKey(b, 'isBar') ? 0 : 1;
            
            if (typeA !== typeB) {
                return typeA - typeB; // Сначала Gauges/Bars (широкие), потом остальные
            }

            // 2. Безопасная сортировка по имени
            const nameA = a.name || ''; // fallback для пустого имени
            const nameB = b.name || '';

            // Если типы одинаковые, сортируем по имени для стабильного порядка
            return nameA.localeCompare(nameB);
        });

        return sortedTags.map(transformTagToWidgetConfig);
        
    }, [tagData]); 

    const renderWidget = (config: KtuWidgetConfig) => {
        
        // Определяем класс ширины в зависимости от типа виджета
        // Gauge и Bar - широкие (2 колонки), остальные - компактные (1 колонка)
        const widthClass = (config.type === 'gauge' || config.type === 'bar') 
                           ? 'widget-col-2' 
                           : 'widget-col-1';
        switch (config.type) {
            case 'gauge':
                return (
                    <div className={widthClass} key={config.key}>
                        <GaugeWidget 
                            key={config.key} 
                            label={config.label} 
                            value={config.value as number} 
                            max={config.max} 
                            unit={config.unit} 
                        />
                    </div>
                );
            case 'bar':
                return (
                    <div className={widthClass} key={config.key}>
                        <VerticalBar
                            key={config.key} 
                            label={config.label} 
                            value={config.value as number} 
                            max={config.max} 
                        />
                    </div>
                );
            case 'number':
                const displayValue = `${config.value}${config.unit ? ` ${config.unit}` : ''}`;
                return (
                    <div className={widthClass} key={config.key}>
                        <NumberDisplay 
                            key={config.key} 
                            label={config.label} 
                            value={displayValue} 
                        />
                    </div>
                );
            case 'status':
                return (
                    <div className={widthClass} key={config.key}>
                        <BypassStatusBlock 
                            key={config.key} 
                            label={config.label} 
                            value={config.value as string} 
                            isOK={config.isOK ?? false} 
                        />
                    </div>
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
                            Параметры КТУ
                        </h1>
                        <div className="ktu-blocks-grid">
                            {ktuWidgetConfigs.map(renderWidget)} 
                        </div>
                    </div>
            </div>
        </div>
    );
}