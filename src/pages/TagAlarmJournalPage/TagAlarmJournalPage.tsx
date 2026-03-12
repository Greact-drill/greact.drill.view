import { useState, useCallback, useEffect } from "react";
import { useParams } from "react-router-dom";
import BackButton from "../../components/BackButton/BackButton";
import Loader from "../../components/Loader/Loader";
import ErrorView from "../../components/ErrorView/ErrorView";
import { useTagAlarmLog } from "../../hooks/useTagAlarmLog";
import type { TagAlarmLogItem } from "../../api/tagAlarmLog";
import "./TagAlarmJournalPage.css";

const PAGE_SIZE = 20;

function formatDateTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatValue(value: number, unit: string) {
  if (Number.isInteger(value)) return `${value} ${unit}`;
  return `${value.toFixed(2)} ${unit}`;
}

function AlarmBadge({ type }: { type: "min" | "max" }) {
  return (
    <span className={`tag-alarm-badge tag-alarm-badge--${type}`}>
      {type === "min" ? "Ниже min" : "Выше max"}
    </span>
  );
}

export default function TagAlarmJournalPage() {
  const { rigId } = useParams<{ rigId: string }>();
  const [page, setPage] = useState(1);
  const [filterTagInput, setFilterTagInput] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [filterType, setFilterType] = useState<"" | "min" | "max">("");

  // Debounce фильтра по тегу (300ms)
  useEffect(() => {
    const t = setTimeout(() => {
      setFilterTag(filterTagInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [filterTagInput]);

  const { data, loading, error, refetch } = useTagAlarmLog(rigId, {
    page,
    limit: PAGE_SIZE,
    tag_name: filterTag || undefined,
    alarm_type: filterType || undefined,
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  return (
    <div className="tag-alarm-journal-page">
      <div className="tag-alarm-journal-content">
        <div className="tag-alarm-journal-header">
          <h1 className="tag-alarm-journal-title">Журнал аварий тегов</h1>
        </div>

        <div className="tag-alarm-journal-controls">
          <BackButton to={rigId ? `/rigs/${rigId}` : "/"} />
          <button
            type="button"
            className="tag-alarm-journal-refresh-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Обновить данные"
          >
            <i className={`pi pi-refresh ${loading ? "pi-spin" : ""}`} />
            <span>Обновить</span>
          </button>
        </div>

        <div className="tag-alarm-journal-body">
          {error && (
            <ErrorView message={`Ошибка загрузки: ${error}`} onRetry={() => refetch()} />
          )}

          {loading && !data && (
            <Loader variant="inline" message="Загрузка журнала..." />
          )}

          {!loading && !error && items.length === 0 && (
            <div className="tag-alarm-journal-empty">
              <div className="tag-alarm-journal-empty-icon">
                <i className="pi pi-check-circle" />
              </div>
              <h3 className="tag-alarm-journal-empty-title">Нет записей об авариях</h3>
              <p className="tag-alarm-journal-empty-desc">
                Все теги в пределах допустимых значений
              </p>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <div className="tag-alarm-journal-table-wrapper">
              <div className="tag-alarm-journal-table-header">
                <h3 className="tag-alarm-journal-table-title">Записи журнала</h3>
                <span className="tag-alarm-journal-table-count">{total} записей</span>
              </div>

              {/* Фильтры */}
              <div className="tag-alarm-journal-filters">
                <div className="tag-alarm-filter-group">
                  <label htmlFor="filter-tag">Тег</label>
                  <input
                    id="filter-tag"
                    type="text"
                    placeholder="Поиск по наименованию..."
                    value={filterTagInput}
                    onChange={(e) => setFilterTagInput(e.target.value)}
                    className="tag-alarm-filter-input"
                  />
                </div>
                <div className="tag-alarm-filter-group">
                  <label htmlFor="filter-type">Тип</label>
                  <select
                    id="filter-type"
                    value={filterType}
                    onChange={(e) => {
                      setFilterType(e.target.value as "" | "min" | "max");
                      setPage(1);
                    }}
                    className="tag-alarm-filter-select"
                  >
                    <option value="">Все</option>
                    <option value="min">Ниже min</option>
                    <option value="max">Выше max</option>
                  </select>
                </div>
              </div>

              <div className="tag-alarm-journal-table-scroll">
                <table className="tag-alarm-journal-table">
                  <thead>
                    <tr>
                      <th>Дата и время</th>
                      <th>Тег</th>
                      <th>Тип</th>
                      <th>Значение</th>
                      <th>Диапазон</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row: TagAlarmLogItem) => (
                      <tr key={row.id}>
                        <td className="tag-alarm-cell-time">
                          {formatDateTime(row.timestamp)}
                        </td>
                        <td className="tag-alarm-cell-tag">
                          <span className="tag-alarm-tag-name">{row.tag_name}</span>
                        </td>
                        <td>
                          <AlarmBadge type={row.alarm_type} />
                        </td>
                        <td className="tag-alarm-cell-value">
                          <span className={`tag-alarm-value tag-alarm-value--${row.alarm_type}`}>
                            {formatValue(row.value, row.unit_of_measurement)}
                          </span>
                        </td>
                        <td className="tag-alarm-cell-range">
                          {row.min_limit} … {row.max_limit} {row.unit_of_measurement}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Пагинация */}
              {totalPages > 1 && (
                <div className="tag-alarm-journal-pagination">
                  <button
                    type="button"
                    className="tag-alarm-pagination-btn"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <i className="pi pi-chevron-left" />
                  </button>
                  <span className="tag-alarm-pagination-info">
                    {page} из {totalPages}
                  </span>
                  <button
                    type="button"
                    className="tag-alarm-pagination-btn"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                  >
                    <i className="pi pi-chevron-right" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
