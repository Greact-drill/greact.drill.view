import "./WidgetEmptyState.css";

interface WidgetEmptyStateProps {
  /** Контекст: "main" — главная страница, иначе — страница оборудования */
  variant?: "main" | "page";
}

export default function WidgetEmptyState({ variant = "page" }: WidgetEmptyStateProps) {
  const isMain = variant === "main";

  return (
    <div className="widget-empty-state" role="status">
      <div className="widget-empty-state-inner">
        <div className="widget-empty-state-icon">
          <i className="pi pi-th-large" />
        </div>
        <div className="widget-empty-state-accent" aria-hidden />
        <h3 className="widget-empty-state-title">
          {isMain ? "Раздел пока пуст" : "Виджеты не настроены"}
        </h3>
        <p className="widget-empty-state-desc">
          {isMain
            ? "Добавьте виджеты в админ-панели, чтобы отобразить данные на главной"
            : "Настройте виджеты в админ-панели для мониторинга этой страницы"}
        </p>
      </div>
    </div>
  );
}
