import type { DragEvent } from "react";
import EmptyState from "../../components/EmptyState/EmptyState";
import type { MediaAsset } from "./useDocumentsCatalog";

interface DocumentsFileListVm {
  visibleDocuments: MediaAsset[];
  filteredDocuments: number;
  selectedCount: number;
  selectedVisibleCount: number;
  selectedDocIds: Record<string, boolean>;
  bulkMoveFolder: string;
  busyDocId: string | null;
  deletingDocId: string | null;
  savingCatalog: boolean;
  uploading: boolean;
  onSetBulkMoveFolder: (value: string) => void;
  onBulkMove: () => Promise<void>;
  onClearSelection: () => void;
  onSelectAllVisible: (checked: boolean) => void;
  onDragStart: (event: DragEvent<HTMLDivElement>, docId: string) => void;
  onDragEnd: () => void;
  onToggleDocumentSelection: (docId: string) => void;
  onDeleteDocument: (doc: MediaAsset) => void;
  onOpen: (doc: MediaAsset) => Promise<void>;
  onDownload: (doc: MediaAsset) => Promise<void>;
  resolveDocumentUrl: (doc: MediaAsset) => string;
  formatUploadedAt: (value?: string) => string;
  getFolderLabel: (group?: string) => string;
}

interface DocumentsFileListProps {
  vm: DocumentsFileListVm;
}

export default function DocumentsFileList({ vm }: DocumentsFileListProps) {
  const {
    visibleDocuments,
    filteredDocuments,
    selectedCount,
    selectedVisibleCount,
    selectedDocIds,
    bulkMoveFolder,
    busyDocId,
    deletingDocId,
    savingCatalog,
    uploading,
    onSetBulkMoveFolder,
    onBulkMove,
    onClearSelection,
    onSelectAllVisible,
    onDragStart,
    onDragEnd,
    onToggleDocumentSelection,
    onDeleteDocument,
    onOpen,
    onDownload,
    resolveDocumentUrl,
    formatUploadedAt,
    getFolderLabel
  } = vm;

  return (
    <div className="documents-files-panel">
      <div className="documents-files-header">
        <div className="documents-files-title">Файлы</div>
        <div className="documents-files-meta">
          Показано: {visibleDocuments.length} из {filteredDocuments}
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="documents-bulk-panel">
          <div className="documents-bulk-count">Выбрано документов: {selectedCount}</div>
          <div className="documents-bulk-controls">
            <input
              type="text"
              value={bulkMoveFolder}
              onChange={event => onSetBulkMoveFolder(event.target.value)}
              placeholder="Новая папка (пусто = Без папки)"
            />
            <button
              type="button"
              className="document-card-link secondary"
              onClick={onBulkMove}
              disabled={savingCatalog || uploading}
            >
              Переместить выбранные
            </button>
            <button type="button" className="document-card-link secondary" onClick={onClearSelection}>
              Снять выбор
            </button>
          </div>
        </div>
      )}

      {visibleDocuments.length === 0 && <EmptyState message="Ничего не найдено по текущему фильтру." />}

      {visibleDocuments.length > 0 && (
        <div className="documents-file-list">
          <div className="document-row document-row-header">
            <div className="document-cell select">
              <input
                type="checkbox"
                checked={visibleDocuments.length > 0 && selectedVisibleCount === visibleDocuments.length}
                onChange={event => onSelectAllVisible(event.target.checked)}
              />
            </div>
            <div className="document-cell">Документ</div>
            <div className="document-cell actions">Действия</div>
          </div>
          {visibleDocuments.map(doc => (
            <div
              className="document-row"
              key={doc.id}
              draggable
              onDragStart={event => onDragStart(event, doc.id)}
              onDragEnd={onDragEnd}
            >
              <div className="document-cell select">
                <input
                  type="checkbox"
                  checked={Boolean(selectedDocIds[doc.id])}
                  onChange={() => onToggleDocumentSelection(doc.id)}
                />
              </div>
              <div className="document-cell">
                <div className="document-row-title">{doc.name || doc.id}</div>
                <div className="document-row-meta">{doc.contentType || "Документ"}</div>
                <div className="document-row-meta secondary">Папка: {getFolderLabel(doc.group)}</div>
                <div className="document-row-meta secondary">{formatUploadedAt(doc.uploadedAt)}</div>
              </div>
              <div className="document-cell actions">
                {resolveDocumentUrl(doc) ? (
                  <>
                    <button
                      type="button"
                      className={`document-card-link${busyDocId === doc.id ? " disabled" : ""}`}
                      onClick={() => onOpen(doc)}
                      disabled={busyDocId === doc.id || deletingDocId === doc.id}
                    >
                      {busyDocId === doc.id ? "Открытие..." : "Открыть"}
                    </button>
                    <button
                      type="button"
                      className={`document-card-link secondary${busyDocId === doc.id ? " disabled" : ""}`}
                      onClick={() => onDownload(doc)}
                      disabled={busyDocId === doc.id || deletingDocId === doc.id}
                    >
                      Скачать
                    </button>
                  </>
                ) : (
                  <span className="document-card-link disabled">Нет ссылки</span>
                )}
                <button
                  type="button"
                  className={`document-card-link danger${deletingDocId === doc.id ? " disabled" : ""}`}
                  onClick={() => onDeleteDocument(doc)}
                  disabled={savingCatalog || deletingDocId === doc.id || uploading}
                >
                  {deletingDocId === doc.id ? "Удаление..." : "Удалить"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
