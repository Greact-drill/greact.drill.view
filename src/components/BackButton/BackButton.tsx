import { Link, useNavigate } from "react-router-dom";
import "./BackButton.css";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  label?: string;
  className?: string;
}

export default function BackButton({
  to,
  onClick,
  label = "Назад",
  className = "",
}: BackButtonProps) {
  const navigate = useNavigate();

  const content = (
    <>
      <span className="back-button-icon">
        <i className="pi pi-arrow-left" />
      </span>
      <span className="back-button-label">{label}</span>
    </>
  );

  const baseClass = `back-button-premium ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={baseClass}>
        {content}
      </Link>
    );
  }

  const handleClick = onClick ?? (() => navigate(-1));

  return (
    <button
      type="button"
      className={baseClass}
      onClick={handleClick}
      aria-label={label}
    >
      {content}
    </button>
  );
}
