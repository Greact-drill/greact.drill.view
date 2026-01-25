import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import { getCurrentByTags, getEdgeCustomizations } from '../../api/edges';
import './MaintenancePage.css';

const maintenanceTypeMap: { [key: string]: string } = {
    'daily_maintenance': 'Ежедневное ТО',
    'weekly_maintenance': 'Еженедельное ТО',
    'monthly_maintenance': 'Ежемесячное ТО',
    'semiannual_maintenance': 'Полугодовое ТО',
    'annual_maintenance': 'Годовое ТО',
};

interface MaintenanceRow {
    tagId: string;
    device: string;
    status: string;
    value: number | string;
    severity: 'success' | 'danger' | 'warning';
}

const parseValue = (raw: unknown): number | null => {
    if (typeof raw === 'number') {
        return raw;
    }
    if (typeof raw === 'string') {
        const normalized = raw.replace(',', '.').trim();
        if (!normalized) return null;
        const parsed = Number(normalized);
        return Number.isNaN(parsed) ? null : parsed;
    }
    if (typeof raw === 'boolean') {
        return raw ? 1 : 0;
    }
    return null;
};

const statusBodyTemplate = (rowData: MaintenanceRow) => {
    return (
        <Tag 
            value={rowData.status} 
            severity={rowData.severity} 
            className="p-tag-sm" 
            style={{ fontWeight: 500 }}
        />
    );
};

const valueBodyTemplate = (rowData: MaintenanceRow) => {
    const isAlert = rowData.severity === 'danger' || rowData.severity === 'warning';
    let color = 'var(--color-text-primary)';
    if (rowData.severity === 'danger') {
        color = 'var(--color-error-light)';
    } else if (rowData.severity === 'warning') {
        color = 'var(--color-warning-light)';
    } else if (rowData.severity === 'success') {
        color = 'var(--color-success-light)';
    }

    return (
        <span style={{
            color: isAlert ? color : 'var(--color-text-primary)',
            fontWeight: isAlert ? 600 : 400
        }}>
            {rowData.value}
        </span>
    );
};

export default function MaintenancePage() {
    const navigate = useNavigate();
    const { maintenanceType, rigId } = useParams<{ maintenanceType: string; rigId: string }>(); 
    
    const title = maintenanceType ? maintenanceTypeMap[maintenanceType] : 'Обслуживание';
    const [maintenanceData, setMaintenanceData] = useState<MaintenanceRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchData = async () => {
            if (!rigId || !maintenanceType) {
                return;
            }
            setLoading(true);
            setErrorMessage(null);
            try {
                const customizations = await getEdgeCustomizations(rigId);
                const maintenanceConfig = customizations.find(item => item.key === 'maintenanceConfig');
                const parsedConfig = maintenanceConfig ? JSON.parse(maintenanceConfig.value) : {};
                const tagIds: string[] = Array.isArray(parsedConfig[maintenanceType])
                    ? parsedConfig[maintenanceType]
                    : [];

                if (!tagIds.length) {
                    setMaintenanceData([]);
                    setLoading(false);
                    return;
                }

                const scoped = await getCurrentByTags(rigId, tagIds, true);
                const tagMap = new Map(scoped.tags.map(tag => [tag.tag, tag]));
                const tagNameMap = new Map(scoped.tags.map(tag => [tag.tag, tag.name || tag.tag]));
                scoped.tagMeta?.forEach(tag => {
                    if (!tagNameMap.has(tag.id)) {
                        tagNameMap.set(tag.id, tag.name || tag.id);
                    }
                });

                const rows = tagIds.map(tagId => {
                    const data = tagMap.get(tagId);
                    if (!data) {
                        return {
                            tagId,
                            device: tagNameMap.get(tagId) ?? tagId,
                            status: 'Нет данных',
                            value: '-',
                            severity: 'warning' as const
                        };
                    }

                    const numericValue = parseValue(data.value);
                    const hasMin = typeof data.min === 'number' && !Number.isNaN(data.min);
                    const hasMax = typeof data.max === 'number' && !Number.isNaN(data.max);
                    const minValue = hasMin ? (data.min as number) : null;
                    const maxValue = hasMax ? (data.max as number) : null;
                    let isOutOfRange = false;
                    if (numericValue !== null && minValue !== null && maxValue !== null && maxValue > minValue) {
                        isOutOfRange = numericValue < minValue || numericValue > maxValue;
                    }

                    return {
                        tagId,
                        device: tagNameMap.get(tagId) ?? (data.name || data.tag),
                        status: isOutOfRange ? 'Требует внимания' : 'В норме',
                        value: data.value,
                        severity: isOutOfRange ? 'danger' as const : 'success' as const
                    };
                });

                setMaintenanceData(rows);
            } catch (error) {
                setErrorMessage('Не удалось загрузить данные ТО.');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [rigId, maintenanceType]);


    if (loading) {
        return (
            <div className="loading-container">
                <ProgressSpinner />
                <p>Загрузка данных по {title}...</p>
            </div>
        );
    }
    
    return (
        <div className="bypass-status-page">
            <div className="bypass-status-page-inner">
                    
                    <div className="bypass-controls-header">
                        <Button 
                            icon="pi pi-arrow-left"
                            label="Назад"
                            severity="secondary"
                            onClick={() => { navigate(-1); }} 
                            className="mb-4 back-button-custom"
                        />
                    </div>

                    <div className="bypass-content-block">
                        <h1 className="bypass-blocks-title">
                            {title}
                        </h1>
                        
                        {errorMessage && (
                            <div className="maintenance-table-container">
                                <Tag severity="danger" value={errorMessage} />
                            </div>
                        )}
                        {!errorMessage && maintenanceData.length === 0 && (
                            <div className="maintenance-table-container">
                                <Tag severity="warning" value="Нет данных для данного ТО." />
                            </div>
                        )}
                        {!errorMessage && maintenanceData.length > 0 && (
                            <div className="maintenance-table-container">
                                <DataTable 
                                    value={maintenanceData} 
                                    responsiveLayout="scroll"
                                    className="p-datatable-gridlines p-datatable-sm maintenance-table-custom"
                                >
                                    <Column 
                                        field="device" 
                                        header="ТЕГ" 
                                        style={{ width: '50%' }}
                                    />
                                    <Column 
                                        field="status" 
                                        header="СТАТУС" 
                                        body={statusBodyTemplate}
                                        style={{ width: '30%' }} 
                                    />
                                    <Column 
                                        field="value" 
                                        header="Значение" 
                                        body={valueBodyTemplate}
                                        style={{ width: '20%' }} 
                                        className="p-text-right"
                                    />
                                </DataTable>
                            </div>
                        )}

                    </div>
            </div>
        </div>
    );
}