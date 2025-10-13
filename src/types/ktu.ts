// types/ktu.ts или общий types.ts

export interface TagData {
    tag: string; // Полное имя тега, например: "БУ14820:p_air_network"
    value: string | number | null;
    unit?: string;
    timestamp?: string;
    status?: 'GOOD' | 'WARNING' | 'ERROR' | 'OFFLINE';
    // Добавьте любые другие поля, которые возвращает ваш API /current
}

// Новый тип для хранения данных (просто словарь, где ключ — полное имя тега)
export type KtuTagMap = Record<string, TagData>;