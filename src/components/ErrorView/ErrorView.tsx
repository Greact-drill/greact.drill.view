import RetryButton from "../RetryButton/RetryButton";
import "./ErrorView.css";

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({
  message = "Произошла ошибка. Попробуйте обновить данные.",
  onRetry,
}: ErrorViewProps) {
  return (
    <div className="error-view" role="alert">
      <i className="pi pi-exclamation-triangle" />
      <span>{message}</span>
      {onRetry ? <RetryButton onClick={onRetry} /> : null}
    </div>
  );
}
