import React from 'react';
import type { TableConfigWithData, TableCell } from '../../api/tableConfigs';
import './TableWidget.css';

interface TableWidgetProps {
  config: TableConfigWithData;
}

const TableWidget: React.FC<TableWidgetProps> = ({ config }) => {
  // Определяем, является ли значение статусным (текстовым)
  const isStatusValue = (value: number | null, tag: any): boolean => {
    if (value === null || value === undefined) return false;
    if (!tag) return false;
    // Если unit_of_measurement === 'bool', то это статус
    return tag.unit_of_measurement === 'bool';
  };

  // Проверяем, находится ли значение в допустимом диапазоне
  const isValueInRange = (value: number | null, tag: any): boolean => {
    if (value === null || value === undefined || !tag) return false;
    if (typeof value !== 'number') return false;
    return value >= tag.min && value <= tag.max;
  };

  // Определяем цвет ячейки на основе значения и типа ячейки
  const getCellClassName = (value: number | null, tag: any, cellType: string): string => {
    if (value === null || value === undefined) return 'table-cell-empty';
    
    // Для типа tag-text используем логику окраски по диапазону
    if (cellType === 'tag-text' && tag) {
      return isValueInRange(value, tag) ? 'table-cell-status-ok' : 'table-cell-status-warning';
    }
    
    if (isStatusValue(value, tag)) {
      // Булевые значения - зеленые, если 1
      return value === 1 ? 'table-cell-status-ok' : 'table-cell-status-warning';
    }

    // Числовые значения - оставляем стандартный стиль
    if (tag && typeof value === 'number') {
      return 'table-cell-value';
    }

    return 'table-cell-value';
  };

  // Форматируем значение для отображения
  const formatValue = (value: number | null, tag: any, cellType: string): string => {
    if (value === null || value === undefined) return '--';

    // Для типа tag-text показываем наименование тега
    if (cellType === 'tag-text' && tag) {
      return tag.name || '--';
    }

    if (isStatusValue(value, tag)) {
      // Для булевых значений показываем текстовое значение
      return value === 1 ? (tag?.name || 'ДА') : 'НЕТ';
    }

    // Для числовых значений форматируем с единицами измерения
    const formatted = typeof value === 'number' 
      ? value.toFixed(2)
      : String(value);
    
    return tag?.unit_of_measurement && tag.unit_of_measurement !== 'bool'
      ? `${formatted} ${tag.unit_of_measurement}`
      : formatted;
  };

  // Получаем содержимое ячейки
  const getCellContent = (cell: TableCell, rowIndex: number, colIndex: number): React.ReactNode => {
    if (cell.type === 'text') {
      return cell.value || '';
    } else if ((cell.type === 'tag-number' || cell.type === 'tag-text') && cell.value) {
      // Получаем данные тега из config.data
      const cellData = config.data?.[rowIndex]?.[colIndex];
      if (cellData) {
        const cellClassName = getCellClassName(cellData.value, cellData.tag, cell.type);
        const displayValue = formatValue(cellData.value, cellData.tag, cell.type);
        return (
          <span className={cellClassName}>
            {displayValue}
          </span>
        );
      } else {
        return '--';
      }
    }
    return '';
  };

  return (
    <div className="table-widget-container">
      {config.title && (
        <h3 className="table-widget-title">{config.title}</h3>
      )}
      <div className="table-widget-wrapper">
        <table className="table-widget">
          <thead>
            <tr>
              {/* Пустая ячейка для пересечения заголовков */}
              <th className="table-header-corner"></th>
              {/* Заголовки столбцов */}
              {Array.from({ length: config.cols }, (_, colIndex) => (
                <th key={colIndex} className="table-header-horizontal">
                  {config.colHeaders?.[colIndex] || `Столбец ${colIndex + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: config.rows }, (_, rowIndex) => {
              const rowCells = config.cells?.[rowIndex] || [];
              return (
                <tr key={rowIndex}>
                  {/* Заголовок строки */}
                  <th className="table-header-vertical">
                    {config.rowHeaders?.[rowIndex] || `Строка ${rowIndex + 1}`}
                  </th>
                  {/* Ячейки данных */}
                  {Array.from({ length: config.cols }, (_, colIndex) => {
                    const cell = rowCells[colIndex] || { type: 'text', value: '' };
                    const cellContent = getCellContent(cell, rowIndex, colIndex);
                    const cellData = config.data?.[rowIndex]?.[colIndex];
                    const cellClassName = cellData ? getCellClassName(cellData.value, cellData.tag, cell.type) : 'table-cell-value';

                    return (
                      <td 
                        key={colIndex}
                        className={`table-cell ${cellClassName}`}
                      >
                        {cellContent}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TableWidget;
