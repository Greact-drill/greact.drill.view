import React, { useMemo } from 'react';

import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useTagsData } from '../../hooks/useTagsData';
import type { TagData, BypassDetail } from '../../types/tag'; 
import { useNavigate } from 'react-router-dom'; 

import './BypassStatusPage.css';
import BypassStatusBlock from '../../components/BypassStatusBlock/BypassStatusBlock';

export default function BypassStatusPage() {

    const navigate = useNavigate();

    const { tagData } = useTagsData(); 

    /**
     * Проверяет, находится ли значение тега в "нормальном" диапазоне.
     * @param tag Объект TagData
     * @returns boolean
    **/
    const isTagValueOK = (tag: TagData): boolean => {
        const { value, min, max, unit_of_measurement } = tag;

        if (unit_of_measurement !== 'bool' && typeof value === 'number') {
            return value >= min && value <= max;
        }

        const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
        if (isStatusTag) {
            return value === 1 || value === true;
        }
        return true;
    };

    /**
     * Трансформирует один TagData в BypassDetail для отображения
     */
    const transformTagToDetail = (tag: TagData): BypassDetail => {
        const isOK = isTagValueOK(tag);
        let displayValue: string | React.ReactNode;

        const isStatusTag = tag.unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');

        if (isStatusTag) {
            displayValue = (
                <Tag
                    value={isOK ? 'ВКЛ' : 'ВЫКЛ'}
                    severity={isOK ? 'success' : 'danger'}
                />
            );
        } else {
            displayValue = `${tag.value} ${tag.unit_of_measurement}`;
        }

        return {
            label: tag.name,
            value: displayValue,
            isOK: isOK,
        };
    };

    /**
     * Проверяет наличие настройки "isBypass": "true"
     */
    const isBypassTag = (tag: TagData): boolean => {
        return tag.customization?.some(item => 
            item.key === 'isBypass' && item.value === 'true'
        ) ?? false; // Возвращаем false, если customization не определен
    };

    // Используем useMemo для фильтрации, СОРТИРОВКИ и преобразования данных
    const bypassDetails: BypassDetail[] = useMemo(() => {
        if (!tagData) return [];
        
        // ШАГ 1: ФИЛЬТРАЦИЯ
        const filteredTags = tagData.filter(isBypassTag);
        
        // ШАГ 2: СОРТИРОВКА для стабильности порядка
        // Создаем копию массива ([...filteredTags]) и сортируем ее по полю name.
        const sortedTags = [...filteredTags].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        // ШАГ 3: ТРАНСФОРМАЦИЯ
        return sortedTags.map(transformTagToDetail);
        
    }, [tagData]); // Пересчет только при изменении данных

    return (
        <div className="bypass-status-page">
            <div className="bypass-status-page-inner">
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
                    <div className="bypass-blocks-grid">
                        {bypassDetails.map((item) => (
                            <BypassStatusBlock
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                isOK={item.isOK}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}