declare module 'react-gauge-chart' {
    import React from 'react';

    interface GaugeChartProps {
        id: string;
        nrOfLevels?: number;
        arcsLength?: number[];
        colors?: string[];
        arcPadding?: number;
        percent: number; // Самый важный пропс, который вы используете
        needleColor?: string;
        textColor?: string;
        hideText?: boolean;
        animate?: boolean;
        // Добавьте сюда любые другие пропсы, которые вы используете
    }

    const GaugeChart: React.FC<GaugeChartProps>;
    export default GaugeChart;
}