import React from 'react';
import { formatNumber } from '../../utils/formatters';
import type { WidgetValue } from '../../utils/widgetValue';

interface CompactTagDisplayProps {
    label: string;
    value: WidgetValue;
    unit?: string;
    isOK: boolean;
    compact?: boolean;
    cardMode?: boolean;
}

const CompactTagDisplay: React.FC<CompactTagDisplayProps> = ({ 
    label, 
    value, 
    unit, 
    isOK,
    compact = false,
    cardMode = false,
}) => {
    const displayValue = typeof value === 'number' ? formatNumber(value) : (value ?? '--');
    const modeClassName = cardMode ? 'widget-card' : compact ? 'widget-compact' : '';

    return (
        <div className={`${modeClassName} compact-tag-display ${isOK ? 'status-ok' : 'status-error'}`.trim()}>
            <div className="compact-tag-header">
                <div className="compact-tag-label" title={label}>
                    {label}
                </div>
                <div className={`compact-tag-status ${isOK ? 'ok' : 'error'}`}>
                    {isOK ? '✓' : '✗'}
                </div>
            </div>
            <div className="compact-tag-value">
                {String(displayValue)}
                {unit && <span className="compact-tag-unit">{unit}</span>}
            </div>
        </div>
    );
};

export default CompactTagDisplay;