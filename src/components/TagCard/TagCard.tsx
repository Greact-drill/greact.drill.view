import React from 'react';
import './TagCard.css';

interface TagCardProps {
  label: string;
  value: number | string | boolean | null;
  unit: string;
  isOK: boolean;
}

const TagCard: React.FC<TagCardProps> = ({ label, value, unit, isOK }) => {
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
          {value !== null && value !== undefined ? `${value}` : '--'}
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