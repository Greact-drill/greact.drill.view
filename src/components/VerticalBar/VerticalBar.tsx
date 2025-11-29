import React from 'react';
import './VerticalBar.css';

interface VerticalBarProps {
  label: string;
  value: number;
  max: number;
}

const VerticalBar: React.FC<VerticalBarProps> = ({ label, value, max }) => {
  // Обеспечиваем, что значение не выходит за пределы [0, max]
  const clampedValue = Math.min(Math.max(value, 0), max);
  // Расчет, сколько процентов "закрывает" бар
  const coverHeight = 100 - (clampedValue / max) * 100;

  return (
    <div className="vertical-bar-container">
      <div className="bar-label">{label}</div>
      <div className="bar-wrapper">
        <div 
          className="bar-cover"
          style={{ 
            height: `${coverHeight}%`
          }}>
        </div>
      </div>
      <div className="bar-value">{value}</div>
    </div>
  );
};

export default React.memo(VerticalBar);
