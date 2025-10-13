// src/pages/AccidentStatusPage.tsx

import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { useTagsData } from '../hooks/useTagsData'; // Хук для получения данных тегов
import type { TagData, BypassDetail } from '../types/tag'; // Интерфейсы используются те же

import '../pages/BypassStatusPage/BypassStatusPage.css'; // Стили используем те же
import BypassStatusBlock from './BypassStatusBlock/BypassStatusBlock'; // Блоки используем те же

interface KtuWidgetConfig {
    key: string;
    type: 'gauge' | 'bar' | 'number';
    label: string;
    value: number;
    max?: number;
    unit: string;
}
// --- ФУНКЦИИ ТРАНСФОРМАЦИИ И ПРОВЕРКИ (остаются без изменений) ---

/**
 * Проверяет, находится ли значение тега в "нормальном" диапазоне.
 */
const isTagValueOK = (tag: TagData): boolean => {
    const { value, min, max, unit_of_measurement } = tag;

    if (unit_of_measurement !== 'bool' && typeof value === 'number') {
        return value >= min && value <= max;
    }

    const isStatusTag = unit_of_measurement === 'bool' || tag.customization?.some(c => c.key === 'isStatus');
    // Для аварийного статуса: "OK" или "Норма" может означать False/0
    // Поэтому логика для статус-тегов может требовать реверсии,
    // но пока оставим как для bypass: True/1 = OK
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
        // Логика отображения для аварийных статусов:
        // isOK (зеленый) = 'Норма' (значение тега False/0, если это аварийный флаг)
        // !isOK (красный) = 'Авария' (значение тега True/1)
        displayValue = (
            <Tag
                value={isOK ? 'Норма' : 'Авария'}
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

const isAccidentTag = (tag: TagData): boolean => {
    return tag.customization?.some(item => 
        item.key === 'isAccident' && item.value === 'true'
    ) ?? false; // Возвращаем false, если customization не определен
};

export default function AccidentStatusPage() {
    const navigate = useNavigate();
    const { tagData, error } = useTagsData(); 

    // Используем useMemo для фильтрации, СОРТИРОВКИ и преобразования данных
    const accidentDetails: BypassDetail[] = useMemo(() => {
        if (!tagData) return [];
        
        // ШАГ 1: ФИЛЬТРАЦИЯ
        // Используем новую функцию фильтрации
        const filteredTags = tagData.filter(isAccidentTag);
        
        // ШАГ 2: СОРТИРОВКА для стабильности порядка (по названию)
        const sortedTags = [...filteredTags].sort((a, b) => 
            a.name.localeCompare(b.name)
        );
        
        // ШАГ 3: ТРАНСФОРМАЦИЯ
        return sortedTags.map(transformTagToDetail);
        
    }, [tagData]);

    // Если данные не найдены или есть ошибка
    if (error || !tagData || tagData.length === 0) {
        return <div className="error-message">Ошибка загрузки: {error || 'Нет данных для отображения.'}</div>;
    }
    
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
                            Состояние аварийных флагов
                        </h1>
                        <div className="bypass-blocks-grid">
                            {accidentDetails.map((item) => (
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