import React from 'react';

interface WidgetPlaceholderProps {
  type: 'gauge' | 'bar' | 'number' | 'status' | 'compact' | 'card';
  label: string;
  unit?: string;
  compact?: boolean;
}

const WidgetPlaceholder: React.FC<WidgetPlaceholderProps> = ({ type, label, unit }) => {
  return (
    <div className={`widget-placeholder placeholder-${type}`}>
      <div className="placeholder-header">
        <div className="placeholder-label">{label}</div>
        <div className="placeholder-loading">
          <div className="loading-dots">
            <span className="dot"></span>
            <span className="dot"></span>
            <span className="dot"></span>
          </div>
        </div>
      </div>
      <div className="placeholder-content">
        {type === 'gauge' && (
          <div className="placeholder-gauge">
            <div className="gauge-circle">
              <div className="gauge-value">--</div>
              {unit && <div className="gauge-unit">{unit}</div>}
            </div>
          </div>
        )}
        {type === 'bar' && (
          <div className="placeholder-bar">
            <div className="bar-track"></div>
            <div className="bar-value">-- {unit}</div>
          </div>
        )}
        {type === 'number' && (
          <div className="placeholder-number">
            <div className="number-value">--</div>
            {unit && <div className="number-unit">{unit}</div>}
          </div>
        )}
        {type === 'status' && (
          <div className="placeholder-status">
            <div className="status-indicator waiting"></div>
            <div className="status-text">Ожидание данных</div>
          </div>
        )}
        {type === 'compact' && (
          <div className="placeholder-compact">
            <div className="compact-value">--</div>
            {unit && <div className="compact-unit">{unit}</div>}
          </div>
        )}
        {type === 'card' && (
          <div className="placeholder-card">
            <div className="card-value">--</div>
            {unit && <div className="card-unit">{unit}</div>}
          </div>
        )}
      </div>
      <div className="placeholder-footer">
        <span className="placeholder-hint">
          <i className="pi pi-clock"></i> Ожидание данных...
        </span>
      </div>
    </div>
  );
};

export default WidgetPlaceholder;