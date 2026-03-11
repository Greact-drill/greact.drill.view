import React from "react";
import "./NoDataWidget.css";

interface NoDataWidgetProps {
  label: string;
  unit?: string;
}

/** Минимальное отображение при отсутствии данных — без анимации */
const NoDataWidget: React.FC<NoDataWidgetProps> = ({ label, unit }) => {
  return (
    <div className="no-data-widget">
      <div className="no-data-label">{label}</div>
      <div className="no-data-value">
        —{unit ? ` ${unit}` : ""}
      </div>
    </div>
  );
};

export default NoDataWidget;
