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
  const numValue = Number(value);
  const numMax = Number(max);
  const clampedValue = Math.min(Math.max(Number.isNaN(numValue) ? 0 : numValue, 0), Math.max(0, numMax));
  const safeMax = numMax > 0 ? numMax : 1;
  const fillPercent = safeMax > 0 ? Math.min(100, Math.max(0, (clampedValue / safeMax) * 100)) : 0;
  const coverHeight = 100 - fillPercent;

  const displayValue = formatNumber(value);

  return (
    <div className="vertical-bar-container">
      <div className="bar-label">{label}</div>
      <div className="bar-wrapper">
        <div
          className="bar-cover"
          style={{ height: `${coverHeight}%` }}
          role="presentation"
          aria-hidden="true"
        />
      </div>
      <div className="bar-value">{displayValue}</div>
    </div>
  );
};

export default React.memo(VerticalBar);
