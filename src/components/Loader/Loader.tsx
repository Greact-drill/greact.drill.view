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
        <span className="loader-letter" style={{ animationDelay: "0ms" }}>D</span>
        <span className="loader-letter" style={{ animationDelay: "100ms" }}>R</span>
        <span className="loader-letter" style={{ animationDelay: "200ms" }}>I</span>
        <span className="loader-letter" style={{ animationDelay: "300ms" }}>L</span>
        <span className="loader-letter" style={{ animationDelay: "400ms" }}>L</span>
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
