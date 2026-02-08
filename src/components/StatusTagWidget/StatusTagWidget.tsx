import React from 'react';
import './StatusTagWidget.css';

interface StatusTagWidgetProps {
  label: string;
  value: boolean;
}

const StatusTagWidget: React.FC<StatusTagWidgetProps> = ({ label, value }) => {
  const statusClass = value ? 'status-tag-widget--ok' : 'status-tag-widget--error';

  return (
    <div className={`status-tag-widget ${statusClass}`}>
      <div className="status-tag-widget__label">{label}</div>
    </div>
  );
};

export default React.memo(StatusTagWidget);
