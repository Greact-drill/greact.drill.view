import type { DragEvent } from "react";
import type { MediaAsset } from "./useDocumentsCatalog";

interface UseDocumentsViewActionsParams {
  assets: MediaAsset[];
  busyDocId: string | null;
  selectedDocIds: Record<string, boolean>;
  visibleDocuments: MediaAsset[];
  draggingDocIds: string[];
  setBusyDocId: (value: string | null) => void;
  setActionError: (value: string | null) => void;
  setSelectedDocIds: (updater: (prev: Record<string, boolean>) => Record<string, boolean>) => void;
  setDraggingDocIds: (value: string[]) => void;
  setDraggingFolderPath: (value: string | null) => void;
  setDragOverFolder: (value: string | null) => void;
  getMediaDownloadUrl: (key: string, download?: boolean) => string;
  normalizeFolderPath: (rawValue?: string) => string;
  defaultFolderName: string;
}

export function useDocumentsViewActions(params: UseDocumentsViewActionsParams) {
  const {
    assets,
    busyDocId,
    selectedDocIds,
    visibleDocuments,
    setBusyDocId,
    setActionError,
    setSelectedDocIds,
    setDraggingDocIds,
    setDraggingFolderPath,
    setDragOverFolder,
    getMediaDownloadUrl,
    normalizeFolderPath,
    defaultFolderName,
  } = params;

  const resolveDocumentUrl = (doc: MediaAsset) => {
    if (doc.key) return getMediaDownloadUrl(doc.key);
    return doc.url || "";
  };

  const resolveFileName = (doc: MediaAsset) => {
    if (doc.name?.trim()) return doc.name.trim();
    if (doc.key) {
      const keyPart = doc.key.split("/").pop() || "document";
      return decodeURIComponent(keyPart);
    }
    if (doc.url) {
      try {
        const url = new URL(doc.url);
        const name = url.pathname.split("/").pop() || "document";
        return decodeURIComponent(name);
      } catch {
        return "document";
      }
    }
    return "document";
  };

  const formatUploadedAt = (value?: string) => {
    if (!value) return "Дата загрузки: —";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Дата загрузки: —";
    return `Загружен: ${date.toLocaleString("ru-RU")}`;
  };

  const fetchDocumentBlob = async (doc: MediaAsset) => {
    const url = resolveDocumentUrl(doc);
    if (!url) throw new Error("missing-url");
    const response = await fetch(url);
    if (!response.ok) throw new Error(`failed-${response.status}`);
    const blob = await response.blob();
    return { blob, filename: resolveFileName(doc) };
  };

  const handleOpen = async (doc: MediaAsset) => {
    if (!resolveDocumentUrl(doc) || busyDocId === doc.id) return;
    setBusyDocId(doc.id);
    setActionError(null);
    try {
      const { blob } = await fetchDocumentBlob(doc);
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      setActionError("Не удалось открыть документ. Попробуйте позже.");
    } finally {
      setBusyDocId(null);
    }
  };

  const handleDownload = async (doc: MediaAsset) => {
    if (!resolveDocumentUrl(doc) || busyDocId === doc.id) return;
    setBusyDocId(doc.id);
    setActionError(null);
    try {
      const { blob, filename } = await fetchDocumentBlob(doc);
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
    } catch {
      setActionError("Не удалось скачать документ. Попробуйте позже.");
    } finally {
      setBusyDocId(null);
    }
  };

  const handleToggleDocumentSelection = (docId: string) => {
    setSelectedDocIds((prev) => ({ ...prev, [docId]: !prev[docId] }));
  };

  const handleSelectAllVisible = (checked: boolean) => {
    setSelectedDocIds((prev) => {
      const next = { ...prev };
      for (const doc of visibleDocuments) {
        next[doc.id] = checked;
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedDocIds(() => ({}));
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, docId: string) => {
    const selectedIds = Object.keys(selectedDocIds).filter((id) => selectedDocIds[id]);
    const dragIds = selectedIds.includes(docId) ? selectedIds : [docId];
    setDraggingDocIds(dragIds);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", dragIds.join(","));
  };

  const handleDragEnd = () => {
    setDraggingDocIds([]);
    setDraggingFolderPath(null);
    setDragOverFolder(null);
  };

  const selectedVisibleCount = visibleDocuments.filter((doc) => selectedDocIds[doc.id]).length;
  const selectedCount = Object.values(selectedDocIds).filter(Boolean).length;
  const totalDocuments = assets.length;
  const getFolderLabel = (group?: string) => normalizeFolderPath(group) || defaultFolderName;

  return {
    resolveDocumentUrl,
    formatUploadedAt,
    handleOpen,
    handleDownload,
    handleToggleDocumentSelection,
    handleSelectAllVisible,
    handleClearSelection,
    handleDragStart,
    handleDragEnd,
    selectedVisibleCount,
    selectedCount,
    totalDocuments,
    getFolderLabel,
  };
}
