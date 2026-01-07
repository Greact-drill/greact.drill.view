// src/components/GaugeWidget.tsx

import React from 'react';
import GaugeChartComponent from './GaugeChart.tsx'; 

interface GaugeWidgetProps {
  label: string;
  value: number;
  max: number;
  unit?: string;
  compact?: boolean;
}

const GaugeWidget: React.FC<GaugeWidgetProps> = React.memo(({ label, value, max, unit = '' }) => {
  
  return (
    <div className="gauge-widget-container" style={{ 
      width: '250px', 
      height: '250px', 
      padding: '20px', 
      
      // ФОН КАРТОЧКИ: Прозрачный фиолетовый для выделения
      backgroundColor: 'rgba(31, 0, 58, 0.5)', /* Насыщенный прозрачный фиолетовый (40% #1f003a) */
      
      // СТИЛИ КАРТОЧКИ: Более яркая обводка и тень
      border: '1px solid rgba(175, 82, 237, 0.3)', /* Легкая фиолетовая рамка */
      borderRadius: '16px',
      boxShadow: '0 0 15px rgba(175, 82, 237, 0.3)', /* Свечение */

      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-around', 
      textAlign: 'center',
    }}>
      {/* ✅ СТИЛЬ ЗАГОЛОВКА КАРТОЧКИ */}
      <h3 style={{ 
        fontSize: '1.1em', 
        margin: '0',
        color: '#FFFFFF', /* Белый цвет */
        fontWeight: 'bold'
      }}>{label}</h3>
      
      <GaugeChartComponent
        label={label}
        value={value}
        max={max}
      />

      {/* ✅ СТИЛЬ ТЕКСТА ЗНАЧЕНИЯ */}
      <div style={{ 
        fontWeight: 'bold', 
        fontSize: '1.6em', 
        marginTop: '-20px',
        color: '#34D399', /* Яркий зеленый для значения */
      }}>
        {Math.round(value)} {unit}
      </div>
    </div>
  );
});

export default GaugeWidget;