import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react'; 
import { Button } from 'primereact/button'; 
import { useTagHistory } from '../../hooks/useTagHistory';
import type { TagHistoryList } from '../../types/tag'; 

import ActionLogTable from '../../components/ActionLogTable/ActionLogTable'; 
import { MOCK_ACTION_LOG } from '../../types/tag';
import { useEdgeWithAttributes } from '../../hooks/useEdges';

const ACCENT_COLOR_1 = '#a78bfa';
const ACCENT_COLOR_2 = '#34D399';
const WARN_COLOR = '#F87171';

const TagHistoryChart = ({ tagsData }: { tagsData: TagHistoryList }) => {

    const chartOption = useMemo(() => {
        if (tagsData.length === 0) return {};
        
        // Цветовая палитра для серий
        const colors = [ACCENT_COLOR_1, ACCENT_COLOR_2, '#ffc700', '#00bcd4'];

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
                backgroundColor: 'rgba(42, 26, 58, 0.9)',
                borderColor: ACCENT_COLOR_1,
                borderWidth: 1,
                textStyle: { color: 'var(--color-text-light)' },
                axisPointer: {
                    type: 'line',
                    lineStyle: { 
                        color: ACCENT_COLOR_1,
                        type: 'dashed'
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
                bottom: '0', // Легенда будет у самого низа
                left: 'center', // Выравниваем по центру
                textStyle: { color: 'var(--color-text-light)' },
                itemGap: 20 // Увеличим отступ между элементами
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
                        color: 'var(--color-text-light)'
                    },
                    fillerColor: 'rgba(167, 139, 250, 0.3)', 
                    handleStyle: {
                        color: ACCENT_COLOR_1 
                    }
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
                    lineStyle: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                axisLine: { lineStyle: { color: ACCENT_COLOR_2 } }
            },
            series: transformedSeriesData
        };
    }, [tagsData]);

    return (
        <div style={{ width: '100%', height: 700, padding: '20px', borderRadius: '16px', background: 'var(--color-card-dark)', boxShadow: '0 0 15px rgba(167, 139, 250, 0.2)' }}>
            <ReactECharts 
                option={chartOption} 
                style={{ height: '100%', width: '100%' }}
                notMerge={true} // Важно для перерисовки, когда меняется тип оси
                opts={{ renderer: 'canvas' }}
            />
        </div>
    );
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
    const { tagHistoryData, loading, error } = useTagHistory(isRealTime, edgeKey);

    // Логика для кнопки
    const toggleRealTime = () => {
        setIsRealTime(prev => !prev);
    };

    const buttonIcon = isRealTime ? 'pi pi-pause' : 'pi pi-play';
    const buttonLabel = isRealTime ? 'Приостановить' : 'Возобновить';

    return (
        <div className="main-page-container">
            <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
                
                <div className="bypass-controls-header" style={{ borderBottom: '1px solid #475569', paddingBottom: '15px', marginBottom: '30px' }}>
                    <Button 
                        icon="pi pi-arrow-left"
                        label={`Назад к Буровой ${rigId}`}
                        severity="secondary"
                        onClick={() => navigate(`/rigs/${rigId}`)}
                        className="mb-4 back-button-custom"
                        style={{ color: 'var(--color-text-light)' }}
                    />
                    <Button
                        icon={buttonIcon}
                        label={buttonLabel}
                        severity={isRealTime ? 'danger' : 'success'} // Красный для паузы, зеленый для возобновления
                        onClick={toggleRealTime}
                        className="mb-4 back-button-custom"
                        style={{ color: 'var(--color-text-light)' }}
                    />
                </div>
                
                <h1 style={{ color: 'var(--color-accent-blue)', marginBottom: '30px' }}>
                    Архив данных и графики для Буровой {selectedEdgeData?.name}
                </h1>

                <div className="charts-grid" style={{ 
                    display: 'grid', 
                    // Адаптация сетки для графика и таблицы
                    gridTemplateColumns: tagHistoryData && tagHistoryData.length > 0 ? '2fr 1fr' : '1fr',
                    gap: '30px' 
                }}></div>

                <div className="charts-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: '1fr',
                    gap: '30px' 
                }}>

                    {error && (
                        <div className="edge-error" style={{ color: WARN_COLOR, padding: '20px', background: 'var(--color-card-dark)', borderRadius: '16px' }}>
                            Ошибка загрузки данных: {error}
                        </div>
                    )}
                    
                    {/* Проверяем, что данные есть и это не пустой массив */}
                    {tagHistoryData && tagHistoryData.length > 0 && (
                        <TagHistoryChart tagsData={tagHistoryData} />
                    )}

                    {/* БЛОК 2: ЖУРНАЛ ДЕЙСТВИЙ */}
                    <div className="action-log-container">
                        <ActionLogTable data={MOCK_ACTION_LOG} />
                    </div>
                    
                    {tagHistoryData && tagHistoryData.length === 0 && !loading && (
                        <div style={{ color: 'var(--color-text-light)', padding: '20px', background: 'var(--color-card-dark)', borderRadius: '16px' }}>
                            Исторические данные не найдены.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}