/**
 * Интерфейс для элемента настройки тега.
 * Примеры: chart, half-circle, isStatus
 */
export interface TagCustomizationItem {
    key: string;
    value: string;
}

/**
 * Интерфейс для полного объекта данных тега, приходящего с API.
 */
export interface TagData {
    tag: string;
    value: number | string | boolean; // Значение тега, может быть числом, строкой или булевым
    name: string; // Человекочитаемое название
    min: number;
    max: number;
    comment: string;
    unit_of_measurement: string;
    customization?: TagCustomizationItem[]; // Опциональное поле
}

/**
 * Интерфейс для данных, которые будет принимать компонент BypassStatusBlock.
 * Включает логику проверки статуса.
 */
export interface BypassDetail {
    label: string;
    value: string | React.ReactNode;
    isOK: boolean; // Статус для индикатора (True = OK/Зеленый, False = Error/Красный)
}

// Тип для массива тегов
export type TagDataList = TagData[];

/**
 * Отдельный элемент истории: метка времени и значение.
 */
export interface HistoryItem {
    timestamp: string;
    value: number;
}

/**
 * Полный объект исторических данных для одного тега.
 */
export interface TagHistoryData {
    tag: string;
    name: string;
    min: number;
    max: number;
    comment: string;
    unit_of_measurement: string;
    history: HistoryItem[];
    customization: { key: string; value: string }[];
}

/**
 * Список исторических данных, возвращаемый API.
 */
export type TagHistoryList = TagHistoryData[];

/**
 * Элемент журнала действий персонала.
 */
export interface ActionLogItem {
    time: string; // Формат ISO 8601 или YYYY-MM-DD HH:MM:SS
    action: string;
}

/**
 * Моковые данные для демонстрации журнала действий.
 */
export const MOCK_ACTION_LOG: ActionLogItem[] = [
    { time: '2025-10-11 10:05:30', action: 'Проведена плановая проверка насоса №1.' },
    { time: '2025-10-11 11:45:00', action: 'Скорректирован уставной параметр давления в гидросистеме (P_MIN).' },
    { time: '2025-10-11 12:30:15', action: 'Зафиксировано временное падение давления. Сброс ошибки.' },
    { time: '2025-10-11 13:55:45', action: 'Персонал произвел замену фильтра на линии подачи.' },
    { time: '2025-10-11 15:20:00', action: 'Система переведена в ручной режим управления на 15 минут.' },
];