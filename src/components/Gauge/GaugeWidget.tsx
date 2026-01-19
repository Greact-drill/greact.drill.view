// src/components/GaugeWidget.tsx

import React from 'react';
import GaugeChartComponent from './GaugeChart.tsx';
import './GaugeWidget.css';

interface GaugeWidgetProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  compact?: boolean;
}

const GaugeWidget: React.FC<GaugeWidgetProps> = React.memo(({ label, value, max, unit = '' }) => {
  return (
    <div className="gauge-widget-container">
      <h3 className="gauge-widget-title">{label}</h3>

      <GaugeChartComponent
        label={label}
        value={value}
        max={max}
      />

      <div className="gauge-widget-value">
        {Math.round(value)} {unit}
      </div>
    </div>
  );
});

export default GaugeWidget;