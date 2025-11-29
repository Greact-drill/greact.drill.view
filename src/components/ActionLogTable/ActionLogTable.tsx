import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import type { ActionLogItem } from '../../types/tag';
import './ActionLogTable.css';


interface ActionLogTableProps {
    data: ActionLogItem[];
}

/**
 * Компонент для отображения журнала действий персонала.
 */
const ActionLogTable: React.FC<ActionLogTableProps> = ({ data }) => {

    const tableStyle = {
        background: 'var(--color-card-dark)', 
        borderRadius: '16px',
        boxShadow: '0 0 15px rgba(167, 139, 250, 0.2)',
        overflow: 'hidden', // Чтобы скругления работали с шапкой
    };

    const headerTemplate = (
        <div style={{ color: 'var(--color-accent-blue)', fontSize: '1.25em', fontWeight: 'bold', padding: '15px' }}>
            Журнал действий персонала
        </div>
    );
    
    // Функция форматирования времени (убираем дату, если она не нужна)
    const timeBodyTemplate = (rowData: ActionLogItem) => {
        try {
            // Пытаемся отформатировать время (убираем секунды для компактности)
            return new Date(rowData.time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return rowData.time; // Возвращаем как есть, если не удалось распарсить
        }
    };

    return (
        <div style={tableStyle}>
            <DataTable 
                value={data} 
                header={headerTemplate}
                size="small"
                stripedRows
                // Адаптация стиля PrimeReact к темной теме
                pt={{
                    root: { className: 'p-datatable-gridlines' }, // Добавляем сетку
                    header: { style: { background: 'rgba(167, 139, 250, 0.1)' } },
                    table: { style: { borderCollapse: 'collapse' } },
                    column: {
                        headerCell: { style: { color: 'var(--color-text-light)', background: 'rgba(167, 139, 250, 0.1)', fontWeight: '600' } },
                        bodyCell: { style: { color: 'var(--color-text-light)', background: 'rgba(167, 139, 250, 0.1)' } }
                    }
                }}
            >
                <Column field="time" header="Время" body={timeBodyTemplate} style={{ width: '150px' }} />
                <Column field="action" header="Действие" />
            </DataTable>
        </div>
    );
};

export default ActionLogTable;