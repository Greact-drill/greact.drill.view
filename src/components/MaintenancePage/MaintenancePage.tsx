import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Tag } from 'primereact/tag';
import './MaintenancePage.css';

const maintenanceTypeMap: { [key: string]: string } = {
    'daily_maintenance': 'Ежедневное ТО',
    'weekly_maintenance': 'Еженедельное ТО',
    'monthly_maintenance': 'Ежемесячное ТО',
    'semiannual_maintenance': 'Полугодовое ТО',
    'annual_maintenance': 'Годовое ТО',
};

interface MaintenanceRow {
    device: string;
    status: string;
    time: number | string;
    severity: 'success' | 'danger' | 'warning';
}

// --- ЗАГЛУШКА ДАННЫХ: Ежедневное ТО ---
// Здесь в реальном приложении будет использован API-ответ для формирования этих данных
const dailyMaintenanceDataStubs: MaintenanceRow[] = [
    { device: 'Агрегат гидравлический_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'success' },
    { device: 'Асдорбционный осушитель_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'success' },
    { device: 'Буровая вышка', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'warning' },
    { device: 'Буровая лебёдка_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'warning' },
    { device: 'Буровой насос №1_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Буровой насос №2_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №1_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №2_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №3_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Винтовой компрессор №1_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
];

// --- НОВАЯ ЗАГЛУШКА ДАННЫХ: Еженедельное ТО (168 часов) ---
const weeklyMaintenanceDataStubs: MaintenanceRow[] = [
    { device: 'Асдорбционный осушитель_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Буровая лебёдка_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №1_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №2_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №3_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вспомогательная лебёдка_1_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вспомогательная лебёдка_2_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'ГШН гидроворонка БДЕ_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'ГШН для перекачки воды БДЕ_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'ГШН для перекачки воды_24', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Гидравлическая станция ГКШ_168', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
];

const monthlyMaintenanceDataStubs: MaintenanceRow[] = [
    { device: 'Агрегат гидравлический_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Асдорбционный осушитель_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Буровая лебёдка_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1581, severity: 'danger' },
    { device: 'Буровой насос №1_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1581, severity: 'danger' },
    { device: 'Буровой насос №2_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1581, severity: 'danger' },
    { device: 'Вибросито №1_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №2_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вибросито №3_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1254, severity: 'danger' },
    { device: 'Вспомогательная лебёдка_1_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1581, severity: 'danger' },
    { device: 'Вспомогательная лебёдка_2_720', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 1581, severity: 'danger' },
];

const semiannualMaintenanceDataStubs: MaintenanceRow[] = [
    { device: 'Буровая лебёдка_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Винтовой компрессор №1_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Винтовой компрессор №2_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Гидроворнка_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'ДЭС-400_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Дегазатор_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Доливной насос_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Илоотделитель_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Кран консольно поворотный_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Насос винтовой №1_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
    { device: 'Насос винтовой №2_2160', status: 'СЕРВИС ПРОСРОЧЕН НА (часов)', time: 2242, severity: 'danger' },
];

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

const timeBodyTemplate = (rowData: MaintenanceRow) => {
    // В зависимости от severity (danger/warning), текст будет красным или желтым
    // Если статус 'danger' (просрочка), делаем время красным
    const isOverdue = rowData.severity === 'danger' || rowData.severity === 'warning';
    
    // Определяем цвет в зависимости от severity
    let timeColor = 'var(--color-text-primary)';
    if (rowData.severity === 'danger') {
        timeColor = 'var(--color-error-light)'; // #f87171
    } else if (rowData.severity === 'warning') {
        timeColor = 'var(--color-warning-light)'; // #fbbf24
    } else if (rowData.severity === 'success') {
        timeColor = 'var(--color-success-light)'; // #4ade80
    }
    
    return (
        <span style={{ 
            color: isOverdue ? timeColor : 'var(--color-text-primary)',
            fontWeight: isOverdue ? 600 : 400
        }}>
            {rowData.time}
        </span>
    );
};

export default function MaintenancePage() {
    const navigate = useNavigate();
    const { maintenanceType } = useParams<{ maintenanceType: string }>(); 
    
    const title = maintenanceType ? maintenanceTypeMap[maintenanceType] : 'Обслуживание';
    const loading = false; // Заглушка: считаем, что данные загружены
    
    const maintenanceData: MaintenanceRow[] = useMemo(() => {
        
        if (maintenanceType === 'daily_maintenance') {
            return dailyMaintenanceDataStubs;
        }

        if (maintenanceType === 'weekly_maintenance') {
            return weeklyMaintenanceDataStubs;
        }

        if (maintenanceType === 'monthly_maintenance') {
            return monthlyMaintenanceDataStubs;
        }

        if (maintenanceType === 'semiannual_maintenance') {
            return semiannualMaintenanceDataStubs;
        }
        // Заглушка для других типов ТО
        return [
            { device: `Данные для ${title}`, status: 'ОК', time: '-', severity: 'success' },
        ];
    }, [maintenanceType]);  


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
                        
                        <div className="maintenance-table-container">
                             <DataTable 
                                value={maintenanceData} 
                                responsiveLayout="scroll"
                                className="p-datatable-gridlines p-datatable-sm maintenance-table-custom"
                            >
                                {/* 1. УСТРОЙСТВО */}
                                <Column 
                                    field="device" 
                                    header="УСТРОЙСТВО" 
                                    style={{ width: '50%' }}
                                />
                                
                                {/* 2. СТАТУС */}
                                <Column 
                                    field="status" 
                                    header="СТАТУС" 
                                    body={statusBodyTemplate}
                                    style={{ width: '35%' }} 
                                />
                                
                                {/* 3. Время, час. */}
                                <Column 
                                    field="time" 
                                    header="Время, час." 
                                    body={timeBodyTemplate} // Используем новый шаблон для стилизации времени
                                    style={{ width: '15%' }} 
                                    className="p-text-right" // Выравниваем по правому краю для чисел
                                />
                             </DataTable>
                        </div>

                    </div>
            </div>
        </div>
    );
}