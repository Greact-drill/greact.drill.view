import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import { useTagHistory } from '../../hooks/useTagHistory';
import type { TagHistoryList, TagHistoryData } from '../../types/tag'; 

import ActionLogTable from '../../components/ActionLogTable/ActionLogTable'; 
import { MOCK_ACTION_LOG } from '../../types/tag';
import { useEdgeWithAttributes } from '../../hooks/useEdges';
import ErrorView from '../../components/ErrorView/ErrorView';
import LoadingState from '../../components/LoadingState/LoadingState';
import './ArchivePage.css';

// Цвета промышленной палитры
const ACCENT_COLOR_1 = '#c97a3d'; // Оранжево-коричневый
const ACCENT_COLOR_2 = '#d4a574'; // Бежевый
const ACCENT_COLOR_3 = '#e8c9a0'; // Светлый беж
const ACCENT_COLOR_4 = '#8b5a2b'; // Темно-коричневый

// Сохраняем выбранные теги при обновлении данных: новые — показывать, существующие — сохранять
// Используем tag.tag (уникальный ID), т.к. tag.name может дублироваться (напр. "Потребление энергии")
function mergeLegendSelected(
    prev: Record<string, boolean>,
    tagIds: string[],
    defaultVisible = true
): Record<string, boolean> {
    const next: Record<string, boolean> = {};
    tagIds.forEach((id) => {
        next[id] = prev[id] !== undefined ? prev[id] : defaultVisible;
    });
    return next;
}

const TagHistoryChart = ({ tagsData }: { tagsData: TagHistoryList }) => {
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const chartInstanceRef = useRef<echarts.ECharts | null>(null);

    const [legendSelected, setLegendSelected] = useState<Record<string, boolean>>({});
    const [legendCollapsed, setLegendCollapsed] = useState(false);
    // Сохраняем приближение (dataZoom) при обновлении данных
    const [dataZoomRange, setDataZoomRange] = useState({ start: 80, end: 100 });

    // При поступлении новых данных не сбрасываем выбор тегов
    useEffect(() => {
        const tagIds = tagsData.map((t) => t.tag);
        setLegendSelected((prev) => mergeLegendSelected(prev, tagIds));
    }, [tagsData]);

    const chartOption = useMemo(() => {
        if (tagsData.length === 0) return {};
        
        // Карта tag.tag -> tag.name для отображения в tooltip (серии именуются по tag.tag)
        const tagNameMap = Object.fromEntries(tagsData.map((t) => [t.tag, t.name]));
        
        // Цветовая палитра для серий - промышленная гамма
        const colors = [ACCENT_COLOR_1, ACCENT_COLOR_2, ACCENT_COLOR_3, ACCENT_COLOR_4];

        // --- 2. Создание серий данных ---
        // Используем tag.tag как уникальное имя серии (tag.name может дублироваться)
        const transformedSeriesData = tagsData.map((tag, index) => {
            const color = colors[index % colors.length];

            // Форматирование данных в [timestamp_ms, value]
            const data = tag.history.map(item => {
                // Преобразуем строку времени в Unix-таймстамп (миллисекунды)
                const timestamp = new Date(item.timestamp).getTime(); 
                return [timestamp, item.value];
            }).reverse(); // Данные должны идти от старых к новым (left-to-right)

            return {
                name: tag.tag,
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
        // Используем фактические значения из history, т.к. tag.min/max в метаданных
        // часто не соответствуют реальным данным (напр. 0-100 при значениях 50000+)
        let dataMin = Infinity;
        let dataMax = -Infinity;
        tagsData.forEach((tag) => {
            tag.history.forEach((item) => {
                const v = typeof item.value === 'number' ? item.value : Number(item.value);
                if (!isNaN(v)) {
                    dataMin = Math.min(dataMin, v);
                    dataMax = Math.max(dataMax, v);
                }
            });
        });
        if (dataMin === Infinity) dataMin = 0;
        if (dataMax === -Infinity) dataMax = 100;
        const range = dataMax - dataMin || 1;
        const padding = range * 0.1;
        const globalMin = Math.floor(dataMin - padding);
        const globalMax = Math.ceil(dataMax + padding);

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
                formatter: function (params: unknown) {
                    const tooltipItems = Array.isArray(params)
                        ? (params as Array<{ value: [number, number]; color: string; seriesName: string }>)
                        : [];
                    const time = tooltipItems[0]
                        ? new Date(tooltipItems[0].value[0]).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                        : '';
                    let result = `<div style="color: #fff; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 5px; margin-bottom: 5px;">${time}</div>`;
                    
                    tooltipItems.forEach((item) => {
                        // item.seriesName = tag.tag; отображаем tag.name из карты
                        const displayName = tagNameMap[item.seriesName] ?? item.seriesName;
                        result += `<div style="color: ${item.color};">
                            ${displayName}: 
                            <strong>${item.value[1].toFixed(2)}</strong>
                        </div>`;
                    });
                    return result;
                }
            },
            legend: {
                show: false,
                selected: legendSelected
            },
            grid: { left: '3%', right: '10%', bottom: '12%', containLabel: true },
            // DATA ZOOM для эффекта скользящего окна (start/end сохраняются при обновлении данных)
            dataZoom: [
                // 1. Зуммирование по X (внутреннее: колесом мыши)
                {
                    id: 'xAxisZoomInside',
                    type: 'inside', 
                    xAxisIndex: [0],
                    start: dataZoomRange.start, 
                    end: dataZoomRange.end,
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
                    id: 'xAxisZoomSlider',
                    type: 'slider', 
                    show: true,
                    xAxisIndex: [0],
                    start: dataZoomRange.start,
                    end: dataZoomRange.end,
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
    }, [tagsData, legendSelected, dataZoomRange]);

    useEffect(() => {
        const container = chartContainerRef.current;
        if (!container) return;

        if (!chartInstanceRef.current) {
            chartInstanceRef.current = echarts.init(container, undefined, { renderer: 'canvas' });
        }

        const chart = chartInstanceRef.current;

        const handleDataZoom = (params: unknown) => {
            const p = params as { start?: number; end?: number; batch?: Array<{ dataZoomId?: string; start?: number; end?: number }> };
            // Обновляем только при изменении zoom по X, чтобы не сбрасывать при zoom по Y
            const xZoomItem = p.batch?.find(
                (b) => b.dataZoomId === 'xAxisZoomInside' || b.dataZoomId === 'xAxisZoomSlider'
            );
            const item = xZoomItem ?? p.batch?.[0] ?? p;
            if (item?.start != null && item?.end != null) {
                setDataZoomRange({ start: item.start, end: item.end });
            }
        };

        chart.off('datazoom', handleDataZoom);
        chart.on('datazoom', handleDataZoom);

        chart.setOption(chartOption, true);

        const resizeObserver = new ResizeObserver(() => {
            chart.resize();
        });
        resizeObserver.observe(container);

        return () => {
            chart.off('datazoom', handleDataZoom);
            resizeObserver.disconnect();
        };
    }, [chartOption]);

    useEffect(() => {
        return () => {
            chartInstanceRef.current?.dispose();
            chartInstanceRef.current = null;
        };
    }, []);

    const toggleTag = (tagId: string) => {
        setLegendSelected((prev) => ({ ...prev, [tagId]: !prev[tagId] }));
    };

    const selectAllTags = () => {
        setLegendSelected((prev) => {
            const next = { ...prev };
            tagsData.forEach((t) => { next[t.tag] = true; });
            return next;
        });
    };

    const deselectAllTags = () => {
        setLegendSelected((prev) => {
            const next = { ...prev };
            tagsData.forEach((t) => { next[t.tag] = false; });
            return next;
        });
    };

    const colors = [ACCENT_COLOR_1, ACCENT_COLOR_2, ACCENT_COLOR_3, ACCENT_COLOR_4];

    return (
        <div className="archive-chart-with-legend">
            <div className="archive-chart-container">
                <div
                    ref={chartContainerRef}
                    className="echarts-for-react"
                    style={{ height: '100%', width: '100%', minHeight: '600px' }}
                />
            </div>
            <div className={`archive-legend ${legendCollapsed ? 'collapsed' : ''}`}>
                <div className="archive-legend-header">
                    <button
                        type="button"
                        className="archive-legend-toggle"
                        onClick={() => setLegendCollapsed((c) => !c)}
                        title={legendCollapsed ? 'Развернуть легенду' : 'Свернуть легенду'}
                    >
                        <i className={`pi ${legendCollapsed ? 'pi-chevron-down' : 'pi-chevron-up'}`} />
                        <span>Легенда</span>
                    </button>
                    {!legendCollapsed && (
                        <div className="archive-legend-bulk">
                            <button type="button" className="archive-legend-bulk-btn" onClick={selectAllTags}>
                                Выбрать все
                            </button>
                            <button type="button" className="archive-legend-bulk-btn" onClick={deselectAllTags}>
                                Снять все
                            </button>
                        </div>
                    )}
                </div>
                {!legendCollapsed && (
                    <div className="archive-legend-items">
                        {tagsData.map((tag, index) => (
                            <label key={tag.tag} className="archive-legend-item">
                                <input
                                    type="checkbox"
                                    checked={legendSelected[tag.tag] !== false}
                                    onChange={() => toggleTag(tag.tag)}
                                />
                                <span
                                    className="archive-legend-color"
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                />
                                <span className="archive-legend-label">{tag.name}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>
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
                        <ErrorView message={`Ошибка загрузки данных: ${error}`} onRetry={toggleRealTime} />
                    )}
                    
                    {loading && !tagHistoryData && (
                        <LoadingState message="Загрузка данных..." />
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