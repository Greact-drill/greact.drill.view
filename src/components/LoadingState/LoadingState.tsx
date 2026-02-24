import "./LoadingState.css";

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Загрузка данных..." }: LoadingStateProps) {
  return (
    <div className="loading-state-ui" role="status" aria-live="polite">
      <i className="pi pi-spin pi-spinner" />
      <span>{message}</span>
    </div>
  );
}
