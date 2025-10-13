import React from 'react';
import './NumberDisplay.css'; 

interface NumberDisplayProps {
  label: string;
  value: string; 
}

const NumberDisplay: React.FC<NumberDisplayProps> = ({ label, value }) => {
  return (
    <div className="number-display-container">
      <div className="number-display-label">{label}</div>
      <div className="number-display-value">
        {value}
      </div>
    </div>
  );
};

export default React.memo(NumberDisplay);
