import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMediaDownloadUrl } from "../../api/media";
import ErrorView from "../../components/ErrorView/ErrorView";
import EmptyState from "../../components/EmptyState/EmptyState";
import LoadingState from "../../components/LoadingState/LoadingState";
import DocumentsFileList from "./DocumentsFileList";
import DocumentsFolderTree from "./DocumentsFolderTree";
import DocumentsModals from "./DocumentsModals";
import { useDocumentsCatalog, type MediaAsset } from "./useDocumentsCatalog";
import { useDocumentsCatalogActions } from "./useDocumentsCatalogActions";
import { useDocumentsViewActions } from "./useDocumentsViewActions";
import "./DocumentsPage.css";

const DEFAULT_FOLDER_NAME = "Без папки";
const UNCATEGORIZED_FOLDER_KEY = "__uncategorized__";

const createAssetId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeFolderPath = (rawValue?: string) => {
  const raw = (rawValue || "").trim();
  if (!raw) return "";
  const segments = raw
    .replace(/\\/g, "/")
    .split("/")
    .map(segment => segment.trim())
    .filter(segment => Boolean(segment) && segment !== "." && segment !== "..");
  return segments.join("/");
};

const sanitizeFileName = (rawName: string) => {
  const prepared = rawName
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w.\-()а-яА-ЯёЁ]/g, "_");
  return prepared || "document";
};

const normalizeUploadedAt = (rawValue?: string, key?: string) => {
  if (rawValue) {
    const date = new Date(rawValue);
    if (!Number.isNaN(date.getTime())) {
      return date.toISOString();
    }
  }
  if (key) {
    const filePart = key.split("/").pop() || "";
    const timestampMatch = filePart.match(/^(\d{13})-\d+-/);
    if (timestampMatch?.[1]) {
      const date = new Date(Number(timestampMatch[1]));
      if (!Number.isNaN(date.getTime())) {
        return date.toISOString();
      }
    }
  }
  return "";
};

const sanitizeAssets = (items: MediaAsset[]): MediaAsset[] => {
  return items
    .map(asset => ({
      id: String(asset.id || "").trim(),
      name: asset.name?.trim() || "",
      group: normalizeFolderPath(asset.group),
      type: "document" as const,
      url: asset.url?.trim() || "",
      key: asset.key?.trim() || "",
      contentType: asset.contentType?.trim() || "",
      uploadedAt: normalizeUploadedAt(asset.uploadedAt, asset.key)
    }))
    .filter(asset => asset.id && (asset.url || asset.key));
};

const sanitizeFolders = (items: string[]): string[] => {
  const unique = new Set<string>();
  for (const item of items) {
    const normalized = normalizeFolderPath(item);
    if (normalized) {
      unique.add(normalized);
    }
  }
  return Array.from(unique).sort((left, right) => left.localeCompare(right, "ru"));
};

export default function DocumentsPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const {
    assets,
    loading,
    errorMessage,
    actionError,
    setActionError,
    successMessage,
    setSuccessMessage,
    savingCatalog,
    selectedFolder,
    setSelectedFolder,
    searchQuery,
    setSearchQuery,
    bulkMoveFolder,
    setBulkMoveFolder,
    selectedDocIds,
    setSelectedDocIds,
    customFolders,
    draggingDocIds,
    setDraggingDocIds,
    draggingFolderPath,
    setDraggingFolderPath,
    dragOverFolder,
    setDragOverFolder,
    expandedFolders,
    setExpandedFolders,
    folderTree,
    totalDocuments,
    filteredDocuments,
    uniqueFoldersCount,
    visibleDocuments,
    selectedCount,
    selectedVisibleCount,
    recentUploadFolders,
    persistCatalog,
  } = useDocumentsCatalog({
    rigId,
    uncategorizedFolderKey: UNCATEGORIZED_FOLDER_KEY,
    defaultFolderName: DEFAULT_FOLDER_NAME,
    normalizeFolderPath,
    sanitizeAssets,
    sanitizeFolders,
  });

  const {
    resolveDocumentUrl,
    formatUploadedAt,
    handleOpen,
    handleDownload,
    handleToggleDocumentSelection,
    handleSelectAllVisible,
    handleClearSelection,
    handleDragStart,
    handleDragEnd,
    getFolderLabel,
  } = useDocumentsViewActions({
    assets,
    busyDocId,
    selectedDocIds,
    visibleDocuments,
    draggingDocIds,
    setBusyDocId,
    setActionError,
    setSelectedDocIds,
    setDraggingDocIds,
    setDraggingFolderPath,
    setDragOverFolder,
    getMediaDownloadUrl,
    normalizeFolderPath,
    defaultFolderName: DEFAULT_FOLDER_NAME,
  });

  const {
    deletingDocId,
    uploading,
    folderMenuPath,
    setFolderMenuPath,
    createFolderModalOpen,
    newFolderName,
    setNewFolderName,
    renameFolderPath,
    renameFolderName,
    setRenameFolderName,
    deleteFolderPath,
    deleteDocument,
    uploadModalOpen,
    uploadFolderMode,
    setUploadFolderMode,
    uploadExistingFolder,
    setUploadExistingFolder,
    uploadNewFolderName,
    setUploadNewFolderName,
    pendingUploadFiles,
    fileInputRef,
    handleToggleFolder,
    handleSaveCatalog,
    handleDeleteDocument,
    handleSelectFiles,
    handleFilesChange,
    handleDroppedUploadFiles,
    handleChooseUploadFiles,
    closeUploadModal,
    confirmUploadFromModal,
    handleBulkMove,
    handleCreateFolder,
    handleRenameFolder,
    handleDeleteFolder,
    closeCreateFolderModal,
    closeRenameFolderModal,
    closeDeleteFolderModal,
    closeDeleteDocumentModal,
    handleFolderDrop,
    handleMoveFolderByDrag,
    confirmCreateFolder,
    confirmRenameFolder,
    confirmDeleteFolder,
    confirmDeleteDocument
  } = useDocumentsCatalogActions({
    rigId,
    assets,
    customFolders,
    selectedFolder,
    bulkMoveFolder,
    selectedDocIds,
    draggingDocIds,
    draggingFolderPath,
    folderTree,
    uncategorizedFolderKey: UNCATEGORIZED_FOLDER_KEY,
    normalizeFolderPath,
    sanitizeFolders,
    sanitizeFileName,
    createAssetId,
    persistCatalog,
    setActionError,
    setSuccessMessage,
    setSelectedFolder,
    setSelectedDocIds,
    setExpandedFolders
  });

  const treeVm = {
    folderTree,
    expandedFolders,
    selectedFolder,
    dragOverFolder,
    draggingDocIds,
    draggingFolderPath,
    folderMenuPath,
    filteredDocuments,
    uncategorizedFolderKey: UNCATEGORIZED_FOLDER_KEY,
    savingCatalog,
    uploading,
    onSelectFolder: setSelectedFolder,
    onSetDragOverFolder: setDragOverFolder,
    onSetDraggingFolderPath: setDraggingFolderPath,
    onToggleFolder: handleToggleFolder,
    onToggleFolderMenu: (path: string) => setFolderMenuPath(prev => (prev === path ? null : path)),
    onCreateFolder: handleCreateFolder,
    onRenameFolder: handleRenameFolder,
    onDeleteFolder: handleDeleteFolder,
    onFolderDrop: handleFolderDrop,
    onMoveFolderByDrag: handleMoveFolderByDrag,
    onDragEnd: handleDragEnd
  };

  const filesVm = {
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
    onSetBulkMoveFolder: setBulkMoveFolder,
    onBulkMove: handleBulkMove,
    onClearSelection: handleClearSelection,
    onSelectAllVisible: handleSelectAllVisible,
    onDragStart: handleDragStart,
    onDragEnd: handleDragEnd,
    onToggleDocumentSelection: handleToggleDocumentSelection,
    onDeleteDocument: handleDeleteDocument,
    onOpen: handleOpen,
    onDownload: handleDownload,
    resolveDocumentUrl,
    formatUploadedAt,
    getFolderLabel
  };

  const modalsVm = {
    folderTree,
    recentUploadFolders,
    selectedFolder,
    uncategorizedFolderKey: UNCATEGORIZED_FOLDER_KEY,
    uploading,
    savingCatalog,
    deletingDocId,
    uploadModalOpen,
    uploadFolderMode,
    uploadExistingFolder,
    uploadNewFolderName,
    pendingUploadFiles,
    createFolderModalOpen,
    newFolderName,
    renameFolderPath,
    renameFolderName,
    deleteFolderPath,
    deleteDocument,
    fileInputRef,
    onSetUploadFolderMode: setUploadFolderMode,
    onSetUploadExistingFolder: setUploadExistingFolder,
    onSetUploadNewFolderName: setUploadNewFolderName,
    onSetNewFolderName: setNewFolderName,
    onSetRenameFolderName: setRenameFolderName,
    onCloseUploadModal: closeUploadModal,
    onConfirmUploadFromModal: confirmUploadFromModal,
    onChooseUploadFiles: handleChooseUploadFiles,
    onCloseCreateFolderModal: closeCreateFolderModal,
    onConfirmCreateFolder: confirmCreateFolder,
    onCloseRenameFolderModal: closeRenameFolderModal,
    onConfirmRenameFolder: confirmRenameFolder,
    onCloseDeleteFolderModal: closeDeleteFolderModal,
    onConfirmDeleteFolder: confirmDeleteFolder,
    onCloseDeleteDocumentModal: closeDeleteDocumentModal,
    onConfirmDeleteDocument: confirmDeleteDocument,
    onFilesChange: handleFilesChange,
    onDropUploadFiles: handleDroppedUploadFiles
  };

  return (
    <div className="documents-page-container">
      <div className="page-header">
        <div className="page-header-content">
          <h1 className="documents-page-title">Документы буровой</h1>
          <p className="documents-page-subtitle">Единый архив технических материалов</p>
        </div>
      </div>

      <div className="documents-page-nav">
        <Link to={`/rigs/${rigId}`} className="documents-nav-link">
          <i className="pi pi-arrow-left" />
          <span>Назад к буровой</span>
        </Link>
      </div>

      <div className="documents-layout">
        <section className="documents-list-section">
          <div className="documents-list-header">
            <div>
              <h3 className="documents-list-title">Каталог документов</h3>
              <p className="documents-list-subtitle">
                Загрузка доступна напрямую в этом сервисе (без admin)
              </p>
            </div>
            <div className="documents-count">
              <span className="documents-count-label">Всего</span>
              <span className="documents-count-value">{totalDocuments}</span>
            </div>
          </div>

          <div className="documents-toolbar">
            <div className="documents-toolbar-row">
              <div className="documents-field">
                <label htmlFor="documents-search">Поиск</label>
                <input
                  id="documents-search"
                  type="text"
                  value={searchQuery}
                  onChange={event => setSearchQuery(event.target.value)}
                  placeholder="Название, тип или папка"
                />
              </div>
            </div>
            <div className="documents-toolbar-row">
              <div className="documents-toolbar-actions">
                <button
                  type="button"
                  className="document-card-link"
                  onClick={handleSelectFiles}
                  disabled={uploading || savingCatalog}
                >
                  {uploading ? "Загрузка..." : "Загрузить документы"}
                </button>
                <button
                  type="button"
                  className="document-card-link secondary"
                  onClick={handleSaveCatalog}
                  disabled={uploading || savingCatalog}
                >
                  {savingCatalog ? "Сохранение..." : "Сохранить каталог"}
                </button>
              </div>
            </div>
          </div>

          {loading && <LoadingState message="Загрузка документов..." />}
          {!loading && errorMessage && <ErrorView message={errorMessage} onRetry={() => window.location.reload()} />}
          {!loading && actionError && <ErrorView message={actionError} onRetry={() => setActionError(null)} />}
          {!loading && successMessage && <div className="documents-success">{successMessage}</div>}
          {!loading && !errorMessage && totalDocuments === 0 && (
            <EmptyState message="Документы пока не добавлены. Загрузите их через форму выше." />
          )}

          {!loading && !errorMessage && totalDocuments > 0 && (
            <div className="documents-browser">
              <DocumentsFolderTree vm={treeVm} />
              <DocumentsFileList vm={filesVm} />
            </div>
          )}
        </section>

        <aside className="documents-info-panel">
          <div className="info-section">
            <h3 className="info-title">Справка</h3>
            <div className="documents-info-list">
              <div className="info-row">
                <span className="info-label">Буровая</span>
                <span className="info-value">#{rigId}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Документов</span>
                <span className="info-value">{totalDocuments || "—"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Групп</span>
                <span className="info-value">{uniqueFoldersCount || "—"}</span>
              </div>
            </div>
          </div>
          <div className="info-section">
            <h3 className="info-title">Совет</h3>
            <div className="documents-tip">
              Используйте модальное окно "Загрузить документы", чтобы выбрать существующую папку
              или создать новую перед загрузкой.
            </div>
          </div>
        </aside>
      </div>
      <DocumentsModals vm={modalsVm} />
    </div>
  );
}
