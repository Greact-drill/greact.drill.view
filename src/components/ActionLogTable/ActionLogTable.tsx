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

    const headerTemplate = (
        <div className="action-log-header">
            <h3 className="action-log-header-title">
                Журнал действий персонала
            </h3>
        </div>
    );
    
    // Функция форматирования времени
    const timeBodyTemplate = (rowData: ActionLogItem) => {
        try {
            const date = new Date(rowData.time);
            return (
                <span className="action-log-time">
                    {date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
            );
        } catch (e) {
            return <span className="action-log-time">{rowData.time}</span>;
        }
    };

    // Функция форматирования действия
    const actionBodyTemplate = (rowData: ActionLogItem) => {
        return <span className="action-log-action">{rowData.action}</span>;
    };

    return (
        <div className="action-log-table-container">
            <DataTable 
                value={data} 
                header={headerTemplate}
                size="small"
                stripedRows
                className="action-log-table"
                selectionMode={undefined}
                dataKey=""
                pt={{
                    root: { style: { border: 'none', background: 'transparent' } },
                    table: { style: { borderCollapse: 'collapse', width: '100%' } },
                    thead: { style: { border: 'none' } },
                    tbody: { style: { border: 'none' } }
                }}
            >
                <Column 
                    field="time" 
                    header="Время" 
                    body={timeBodyTemplate} 
                    style={{ width: '180px', minWidth: '180px' }}
                    className="action-log-time-column"
                />
                <Column 
                    field="action" 
                    header="Действие" 
                    body={actionBodyTemplate}
                    className="action-log-action-column"
                />
            </DataTable>
        </div>
    );
};

export default ActionLogTable;