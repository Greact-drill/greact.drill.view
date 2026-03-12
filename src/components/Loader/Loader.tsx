import React from "react";
import "./Loader.css";

interface LoaderProps {
  message?: string;
  variant?: "inline" | "overlay" | "fullscreen";
  compact?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({
  message = "Загрузка...",
  variant = "inline",
  compact = false,
}) => {
  const content = (
    <div className="loader-content">
      <div className="loader-drill">
        <span className="loader-letter">D</span>
        <span className="loader-letter">R</span>
        <span className="loader-letter">I</span>
        <span className="loader-letter">L</span>
        <span className="loader-letter">L</span>
      </div>
      {message ? <span className="loader-message">{message}</span> : null}
    </div>
  );

  const variantClass = `loader-${variant}`;
  const compactClass = compact ? "loader-compact" : "";

  return (
    <div className={`loader ${variantClass} ${compactClass}`}>
      {content}
    </div>
  );
};

export default Loader;
