export interface TagData {
    tag: string;
    value: string | number | null;
    unit?: string;
    timestamp?: string;
    status?: 'GOOD' | 'WARNING' | 'ERROR' | 'OFFLINE';
}

export type KtuTagMap = Record<string, TagData>;