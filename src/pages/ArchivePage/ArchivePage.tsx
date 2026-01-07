import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react'; 
import { Button } from 'primereact/button'; 
import { useTagHistory } from '../../hooks/useTagHistory';
import type { TagHistoryList, TagHistoryData } from '../../types/tag'; 

import ActionLogTable from '../../components/ActionLogTable/ActionLogTable'; 
import { MOCK_ACTION_LOG } from '../../types/tag';
import { useEdgeWithAttributes } from '../../hooks/useEdges';
import './ArchivePage.css';

// Цвета промышленной палитры
const ACCENT_COLOR_1 = '#c97a3d'; // Оранжево-коричневый
const ACCENT_COLOR_2 = '#d4a574'; // Бежевый
const ACCENT_COLOR_3 = '#e8c9a0'; // Светлый беж
const ACCENT_COLOR_4 = '#8b5a2b'; // Темно-коричневый
const WARN_COLOR = '#f87171';

const TagHistoryChart = ({ tagsData }: { tagsData: TagHistoryList }) => {

    const chartOption = useMemo(() => {
        if (tagsData.length === 0) return {};
        
        // Цветовая палитра для серий - промышленная гамма
        const colors = [ACCENT_COLOR_1, ACCENT_COLOR_2, ACCENT_COLOR_3, ACCENT_COLOR_4];

        // --- 2. Создание серий данных ---
        const transformedSeriesData = tagsData.map((tag, index) => {
            const color = colors[index % colors.length];

            // Форматирование данных в [timestamp_ms, value]
            const data = tag.history.map(item => {
                // Преобразуем строку времени в Unix-таймстамп (миллисекунды)
                const timestamp = new Date(item.timestamp).getTime(); 
                return [timestamp, item.value];
            }).reverse(); // Данные должны идти от старых к новым (left-to-right)

            return {
                name: tag.name,
                type: 'line',
                smooth: true,
                data: data,
                yAxisIndex: 0,
                showSymbol: false, 
                hoverAnimation: false,
                itemStyle: { color: color },
                lineStyle: {
                    width: 3,
                    shadowColor: color,
                    shadowBlur: 8, 
                    opacity: 0.8
                },
                areaStyle: {
                    color: {
                        type: 'linear', x: 0, y: 0, x2: 0, y2: 1, 
                        colorStops: [{ offset: 0, color: color }, { offset: 1, color: 'transparent' }]
                    }, 
                    opacity: 0.15
                },
            };
        });

        // --- 2. Настройка диапазона Y-оси ---
        let globalMin = Math.min(...tagsData.map(tag => tag.min));
        let globalMax = Math.max(...tagsData.map(tag => tag.max));
        const padding = (globalMax - globalMin) * 0.1;
        globalMin = Math.floor(globalMin - padding);
        globalMax = Math.ceil(globalMax + padding);

        // --- 3. Финальная опция ECharts ---
        return {
            backgroundColor: 'transparent',
            animation: true, 
            // ПЛАВНЫЙ ПЕРЕХОД: Анимация при обновлении данных
            animationDurationUpdate: 500, 
            title: {
            },
            tooltip: {
                trigger: 'axis',
                backgroundColor: 'rgba(10, 13, 18, 0.95)',
                borderColor: ACCENT_COLOR_1,
                borderWidth: 1,
                textStyle: { color: 'var(--color-text-primary)' },
                axisPointer: {
                    type: 'line',
                    lineStyle: { 
                        color: ACCENT_COLOR_1,
                        type: 'dashed',
                        width: 1
                    }
                },
                // Форматирование подсказки для отображения времени и значения
                formatter: function (params: any) {
                    const time = new Date(params[0].value[0]).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    let result = `<div style="color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; margin-bottom: 5px;">${time}</div>`;
                    
                    params.forEach((item: any) => {
                        // item.seriesName - имя тега, item.value[1] - значение
                        result += `<div style="color: ${item.color};">
                            ${item.seriesName}: 
                            <strong>${item.value[1].toFixed(2)}</strong>
                        </div>`;
                    });
                    return result;
                }
            },
            legend: {
                data: tagsData.map(t => t.name),
                bottom: '0',
                left: 'center',
                textStyle: { 
                    color: 'var(--color-text-primary)',
                    fontSize: 12,
                    fontWeight: 400
                },
                itemGap: 24,
                itemWidth: 14,
                itemHeight: 14
            },
            grid: { left: '3%', right: '10%', bottom: '20%', containLabel: true },
            // DATA ZOOM для эффекта скользящего окна
            dataZoom: [
                // 1. Зуммирование по X (внутреннее: колесом мыши)
                {
                    type: 'inside', 
                    xAxisIndex: [0],
                    start: 80, 
                    end: 100,
                    filterMode: 'none',
                },
                // 2. Зуммирование по Y (внутреннее: колесом мыши)
                {
                    type: 'inside', 
                    yAxisIndex: [0], // Привязка к Y-оси
                    start: 0, 
                    end: 100 
                },
                // 3. Слайдер по X (визуальный ползунок)
                {
                    type: 'slider', 
                    show: true,
                    xAxisIndex: [0],
                    height: 20, 
                    top: 10, 
                    textStyle: {
                        color: 'var(--color-text-primary)',
                        fontSize: 11
                    },
                    fillerColor: 'rgba(201, 122, 61, 0.4)', 
                    handleStyle: {
                        color: ACCENT_COLOR_1,
                        borderColor: ACCENT_COLOR_1,
                        borderWidth: 2
                    },
                    moveHandleStyle: {
                        color: ACCENT_COLOR_1,
                        borderColor: ACCENT_COLOR_1,
                        borderWidth: 2
                    },
                    borderColor: 'rgba(212, 165, 116, 0.3)',
                    dataBackground: {
                        lineStyle: { 
                            color: 'rgba(212, 165, 116, 0.3)',
                            width: 1
                        },
                        areaStyle: { 
                            color: 'rgba(201, 122, 61, 0.15)'
                        }
                    },
                    selectedDataBackground: {
                        lineStyle: { 
                            color: ACCENT_COLOR_1,
                            width: 1.5
                        },
                        areaStyle: { 
                            color: 'rgba(201, 122, 61, 0.3)'
                        }
                    },
                    handleIcon: 'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.2,10.8,24.1,24.1,24.1C44.2,51.7,55,40.8,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.6-0.4,1-1,1H26c-0.6,0-1-0.4-1-1V19.4c0-0.6,0.4-1,1-1h9.9c0.6,0,1,0.4,1,1V35.8z',
                    moveHandleIcon: 'path://M30.9,53.2C16.8,53.2,5.3,41.7,5.3,27.6S16.8,2,30.9,2C45,2,56.4,13.5,56.4,27.6S45,53.2,30.9,53.2z M30.9,3.5C17.6,3.5,6.8,14.4,6.8,27.6c0,13.2,10.8,24.1,24.1,24.1C44.2,51.7,55,40.8,55,27.6C54.9,14.4,44.1,3.5,30.9,3.5z M36.9,35.8c0,0.6-0.4,1-1,1H26c-0.6,0-1-0.4-1-1V19.4c0-0.6,0.4-1,1-1h9.9c0.6,0,1,0.4,1,1V35.8z'
                }
                // Примечание: Мы не добавляем слайдер по Y, чтобы не занимать место на странице. 
                // Внутренний зум (колесом мыши) обычно достаточен для Y.
            ],
            xAxis: {
                type: 'time', // Меняем на 'time'
                axisLabel: {
                    formatter: (value: number) => {
                        // value - это числовой таймстамп
                        return new Date(value).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    },
                    color: ACCENT_COLOR_1,
                },
                splitLine: { show: false },
                axisLine: { lineStyle: { color: ACCENT_COLOR_1 } }
            },
            yAxis: {
                type: 'value',
                min: globalMin,
                max: globalMax,
                axisLabel: {
                    formatter: '{value}',
                    color: ACCENT_COLOR_2
                },
                splitLine: {
                    show: true,
                    lineStyle: {
                        color: 'rgba(212, 165, 116, 0.1)',
                        type: 'dashed',
                        width: 1
                    }
                },
                axisLine: { lineStyle: { color: ACCENT_COLOR_2 } }
            },
            series: transformedSeriesData
        };
    }, [tagsData]);

    return (
        <div className="archive-chart-container">
            <ReactECharts 
                option={chartOption} 
                style={{ height: '100%', width: '100%', minHeight: '600px' }}
                notMerge={true}
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
};

// Тестовые данные для эмуляции
const generateMockTagHistory = (): TagHistoryList => {
    const now = Date.now();
    const hoursAgo = (h: number) => now - (h * 60 * 60 * 1000);
    
    const tags: TagHistoryData[] = [
        {
            tag: 'pressure_main',
            name: 'Давление в магистрали',
            min: 0,
            max: 100,
            comment: 'Основное давление в системе',
            unit_of_measurement: 'бар',
            customization: [],
            history: Array.from({ length: 50 }, (_, i) => ({
                timestamp: new Date(hoursAgo(50 - i)).toISOString(),
                value: 45 + Math.sin(i / 5) * 10 + Math.random() * 5
            }))
        },
        {
            tag: 'temperature_engine',
            name: 'Температура двигателя',
            min: 0,
            max: 120,
            comment: 'Температура основного двигателя',
            unit_of_measurement: '°C',
            customization: [],
            history: Array.from({ length: 50 }, (_, i) => ({
                timestamp: new Date(hoursAgo(50 - i)).toISOString(),
                value: 75 + Math.cos(i / 7) * 15 + Math.random() * 3
            }))
        },
        {
            tag: 'flow_rate',
            name: 'Расход жидкости',
            min: 0,
            max: 200,
            comment: 'Скорость потока',
            unit_of_measurement: 'л/мин',
            customization: [],
            history: Array.from({ length: 50 }, (_, i) => ({
                timestamp: new Date(hoursAgo(50 - i)).toISOString(),
                value: 120 + Math.sin(i / 4) * 30 + Math.random() * 10
            }))
        },
        {
            tag: 'vibration_level',
            name: 'Уровень вибрации',
            min: 0,
            max: 50,
            comment: 'Вибрация оборудования',
            unit_of_measurement: 'мм/с',
            customization: [],
            history: Array.from({ length: 50 }, (_, i) => ({
                timestamp: new Date(hoursAgo(50 - i)).toISOString(),
                value: 15 + Math.random() * 10 + (i > 30 ? 5 : 0)
            }))
        }
    ];
    
    return tags;
};

// --- КОМПОНЕНТ СТРАНИЦЫ АРХИВА ---
export default function ArchivePage() {
    const { rigId } = useParams<{ rigId: string }>();
    const edgeKey = `${rigId}`;
    const navigate = useNavigate();

    const { edgeData: selectedEdgeData } = useEdgeWithAttributes(edgeKey);

    // Включаем режим реального времени по умолчанию
    const [isRealTime, setIsRealTime] = useState(true);
    // ИСПОЛЬЗУЕМ ХУК с параметром isRealTime
    const { tagHistoryData: apiTagHistoryData, loading, error } = useTagHistory(isRealTime, edgeKey);
    
    // Используем тестовые данные, если API не вернул данные
    const tagHistoryData = apiTagHistoryData && apiTagHistoryData.length > 0 
        ? apiTagHistoryData 
        : generateMockTagHistory();

    // Логика для кнопки
    const toggleRealTime = () => {
        setIsRealTime(prev => !prev);
    };

    const buttonIcon = isRealTime ? 'pi pi-pause' : 'pi pi-play';
    const buttonLabel = isRealTime ? 'Приостановить' : 'Возобновить';

    return (
        <div className="archive-page-container">
            <div className="archive-content-wrapper">
                
                {/* Заголовок страницы */}
                <div className="archive-page-header">
                    <h1 className="archive-page-title">
                        Архив данных
                    </h1>
                    <div className="archive-page-subtitle">
                        Наименование буровой: {selectedEdgeData?.name || `Буровая установка №${rigId}`}
                    </div>
                </div>

                {/* Панель управления */}
                <div className="archive-controls">
                    <div className="archive-controls-left">
                        <button 
                            className="archive-back-button"
                            onClick={() => navigate(`/rigs/${rigId}`)}
                        >
                            <i className="pi pi-arrow-left" />
                            <span>Назад</span>
                        </button>
                        <button
                            className={`archive-control-button ${isRealTime ? 'active' : 'paused'}`}
                            onClick={toggleRealTime}
                        >
                            <i className={buttonIcon} />
                            <span>{buttonLabel}</span>
                        </button>
                    </div>
                </div>

                {/* Контент */}
                <div>
                    {error && (
                        <div className="archive-error-message">
                            <i className="pi pi-exclamation-triangle" style={{ marginRight: '8px' }} />
                            Ошибка загрузки данных: {error}
                        </div>
                    )}
                    
                    {loading && !tagHistoryData && (
                        <div className="archive-empty-message">
                            <i className="pi pi-spin pi-spinner" style={{ marginRight: '8px' }} />
                            Загрузка данных...
                        </div>
                    )}
                    
                    {/* График */}
                    {tagHistoryData && tagHistoryData.length > 0 && (
                        <TagHistoryChart tagsData={tagHistoryData} />
                    )}

                    {/* Журнал действий */}
                    <div className="archive-action-log-container">
                        <ActionLogTable data={MOCK_ACTION_LOG} />
                    </div>
                </div>
            </div>
        </div>
    );
}