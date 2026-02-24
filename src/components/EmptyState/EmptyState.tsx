import "./EmptyState.css";

interface EmptyStateProps {
  message?: string;
}

export default function EmptyState({ message = "Нет данных для отображения." }: EmptyStateProps) {
  return (
    <div className="empty-state" role="status">
      <i className="pi pi-inbox" />
      <span>{message}</span>
    </div>
  );
}
