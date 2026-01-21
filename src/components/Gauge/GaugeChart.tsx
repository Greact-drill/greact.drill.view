import React, { useRef } from 'react';
import { Doughnut } from 'react-chartjs-2'; 
import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    type ScriptableContext,
    type ChartData as CoreChartData,
    type ChartDataset
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface GaugeChartProps {
    label: string;
    value: number;
    max: number;
}

type DoughnutContext = ScriptableContext<'doughnut'>;

// 1. Добавляем React.memo для предотвращения мерцания
const GaugeChart: React.FC<GaugeChartProps> = React.memo(({ label, value, max }) => {
    const chartRef = useRef<ChartJS<'doughnut', number[], string> | null>(null);
    
    // Функция создания ГРАДИЕНТА (как в вашем старом коде, но с явными типами)
    const getGradient = (chart: ChartJS) => {
        const { ctx, chartArea } = chart;
        
        // Используем chartArea для создания градиента, привязанного к геометрии
        if (!chartArea) return '#34D399';
        
        // Создаем линейный градиент слева направо (от chartArea.left до chartArea.right)
        const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0); 
        
        // Ваши стопы градиента
        gradient.addColorStop(0, '#34D399');   // Левый цвет (зеленый)
        gradient.addColorStop(0.3, '#F5CD19');  // Середина (желтый)
        gradient.addColorStop(0.7, '#F87171');  // Правый цвет (красный)
        
        return gradient;
    };

    // Данные для Doughnut Chart
    const data: CoreChartData<'doughnut'> = {
        labels: [label],
        datasets: [{
            data: [value, max - value], 
            backgroundColor: (context: DoughnutContext) => {
                const chart = context.chart as ChartJS;
                if (chart) {
                    // Кусок 0 (значение) - ГРАДИЕНТ, Кусок 1 (остаток) - серый фон
                    return [getGradient(chart), 'rgba(0, 0, 0, 0.1)']; 
                }
                return ['rgba(0, 0, 0, 0.1)'];
            },
            borderWidth: 0,
        } as ChartDataset<'doughnut'>], 
    };

    // Опции для полукруга
    const options = {
        responsive: true,
        maintainAspectRatio: false, // Позволяет контролировать размер через div
        cutout: '70%',      // Толщина кольца
        circumference: 180,  // Полукруг
        rotation: -90,       // Поворот, чтобы начинался снизу
        plugins: {
            tooltip: { enabled: false },
            legend: { display: false },
        },
    };

    return (
        // Контейнер размера задается через CSS для разных контекстов
        <div className="gauge-chart-container"> 
            <Doughnut 
                ref={chartRef as React.LegacyRef<any>} 
                data={data} 
                options={options} 
            />
        </div>
    );
});

export default GaugeChart;