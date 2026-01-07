import React from 'react';

interface CompactTagDisplayProps {
    label: string;
    value: any;
    unit?: string;
    isOK: boolean;
    compact?: boolean;
    cardMode?: boolean;
}

const CompactTagDisplay: React.FC<CompactTagDisplayProps> = ({ 
    label, 
    value, 
    unit, 
    isOK 
}) => {
    return (
        <div className={`compact-tag-display ${isOK ? 'status-ok' : 'status-error'}`}>
            <div className="compact-tag-header">
                <div className="compact-tag-label" title={label}>
                    {label}
                </div>
                <div className={`compact-tag-status ${isOK ? 'ok' : 'error'}`}>
                    {isOK ? '✓' : '✗'}
                </div>
            </div>
            <div className="compact-tag-value">
                {String(value)}
                {unit && <span className="compact-tag-unit">{unit}</span>}
            </div>
        </div>
    );
};

export default CompactTagDisplay;