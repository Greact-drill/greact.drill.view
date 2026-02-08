import React from 'react';
import { formatNumber } from '../../utils/formatters';
import './TagCard.css';

interface TagCardProps {
  label: string;
  value: number | string | boolean | null;
  unit: string;
  isOK: boolean;
}

const TagCard: React.FC<TagCardProps> = ({ label, value, unit, isOK }) => {
  const displayValue = typeof value === 'number' ? formatNumber(value) : (value ?? '--');

  return (
    <div className={`tag-card ${isOK ? 'tag-card-ok' : 'tag-card-alarm'}`}>
      <div className="tag-card-header">
        <h3>{label}</h3>
        <span className="tag-card-badge">
          {isOK ? '✓ OK' : '⚠ ALARM'}
        </span>
      </div>
      <div className="tag-card-body">
        <div className="tag-card-value">
          {String(displayValue)}
        </div>
        <div className="tag-card-unit">
          {unit}
        </div>
      </div>
      <div className="tag-card-footer">
        <span className="tag-card-status">
          {isOK ? 'Норма' : 'Тревога'}
        </span>
      </div>
    </div>
  );
};

export default React.memo(TagCard);