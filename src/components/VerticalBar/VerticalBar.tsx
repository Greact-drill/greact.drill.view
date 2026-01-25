import React from 'react';
import { formatNumber } from '../../utils/formatters';
import './VerticalBar.css';

interface VerticalBarProps {
  label: string;
  value: number;
  max: number;
  compact?: boolean;
}

const VerticalBar: React.FC<VerticalBarProps> = ({ label, value, max }) => {
  // Обеспечиваем, что значение не выходит за пределы [0, max]
  const clampedValue = Math.min(Math.max(value, 0), max);
  const safeMax = max > 0 ? max : 0;
  const fillPercent = safeMax > 0 ? (clampedValue / safeMax) * 100 : 0;
  // Расчет, сколько процентов "закрывает" бар
  const coverHeight = 100 - fillPercent;

  const displayValue = formatNumber(value);

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
      <div className="bar-value">{displayValue}</div>
    </div>
  );
};

export default React.memo(VerticalBar);
