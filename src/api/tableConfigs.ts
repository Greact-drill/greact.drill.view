import { apiClient } from './client';

export interface TableCell {
  type: 'text' | 'tag-number' | 'tag-text';
  value: string | null; // Для text - сам текст, для tag-number и tag-text - tag_id
  tag_id?: string; // Для tag типов
}

export interface TableConfig {
  page: string;
  title?: string;
  rows: number; // Количество строк
  cols: number; // Количество столбцов
  rowHeaders?: string[]; // Заголовки строк (опционально)
  colHeaders?: string[]; // Заголовки столбцов (опционально)
  cells: TableCell[][]; // Двумерный массив ячеек [row][col]
}

export interface TableCellData {
  value: number | null;
  tag: {
    id: string;
    name: string;
    comment: string;
    unit_of_measurement: string;
    min: number;
    max: number;
  } | null;
  updatedAt: string | null;
}

export interface TableConfigWithData extends TableConfig {
  id: number;
  data?: {
    // Данные для тегов - массив значений по индексам ячеек
    [rowIndex: number]: {
      [colIndex: number]: TableCellData | null;
    };
  };
}

// Получение конфигурации таблицы по странице
export async function getTableConfigByPage(page: string): Promise<TableConfigWithData | null> {
  const response = await apiClient.get<TableConfigWithData | null>(`/edge/page/${page}/table-config`);
  return response.data;
}
