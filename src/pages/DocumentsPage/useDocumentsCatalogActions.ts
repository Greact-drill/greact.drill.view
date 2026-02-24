import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { uploadMediaAsset } from "../../api/media";
import { useModalKeyboardActions } from "../../hooks/useModalKeyboardActions";
import type { FolderTreeNode, MediaAsset } from "./useDocumentsCatalog";

interface UseDocumentsCatalogActionsParams {
  rigId: string;
  assets: MediaAsset[];
  customFolders: string[];
  selectedFolder: string;
  bulkMoveFolder: string;
  selectedDocIds: Record<string, boolean>;
  draggingDocIds: string[];
  draggingFolderPath: string | null;
  folderTree: { nodes: Record<string, FolderTreeNode> };
  uncategorizedFolderKey: string;
  normalizeFolderPath: (rawValue?: string) => string;
  sanitizeFolders: (items: string[]) => string[];
  sanitizeFileName: (rawName: string) => string;
  createAssetId: () => string;
  persistCatalog: (
    nextAssets: MediaAsset[],
    nextFolders: string[],
    successText: string,
    errorText: string
  ) => Promise<boolean>;
  setActionError: (value: string | null) => void;
  setSuccessMessage: (value: string | null) => void;
  setSelectedFolder: (value: string) => void;
  setSelectedDocIds: (
    updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
  setExpandedFolders: (
    updater: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)
  ) => void;
}

export function useDocumentsCatalogActions(params: UseDocumentsCatalogActionsParams) {
  const {
    rigId,
    assets,
    customFolders,
    selectedFolder,
    bulkMoveFolder,
    selectedDocIds,
    draggingDocIds,
    draggingFolderPath,
    folderTree,
    uncategorizedFolderKey,
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
  } = params;

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [folderMenuPath, setFolderMenuPath] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderPath, setRenameFolderPath] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [deleteFolderPath, setDeleteFolderPath] = useState<string | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<MediaAsset | null>(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadFolderMode, setUploadFolderMode] = useState<"existing" | "new">("existing");
  const [uploadExistingFolder, setUploadExistingFolder] = useState("");
  const [uploadNewFolderName, setUploadNewFolderName] = useState("");
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const remapFolderPath = (value: string, sourcePath: string, targetPath: string) => {
    const normalized = normalizeFolderPath(value);
    if (!normalized) return "";
    if (normalized === sourcePath) return targetPath;
    if (normalized.startsWith(`${sourcePath}/`)) {
      const suffix = normalized.slice(sourcePath.length + 1);
      return targetPath ? `${targetPath}/${suffix}` : suffix;
    }
    return normalized;
  };

  const handleToggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleSaveCatalog = async () => {
    await persistCatalog(
      assets,
      customFolders,
      "Каталог документов сохранен.",
      "Не удалось сохранить каталог документов."
    );
  };

  const handleDeleteDocument = (doc: MediaAsset) => {
    setDeleteDocument(doc);
  };

  const confirmDeleteDocument = async () => {
    const doc = deleteDocument;
    if (!doc) return;
    setDeletingDocId(doc.id);
    const nextAssets = assets.filter(item => item.id !== doc.id);
    const isSaved = await persistCatalog(
      nextAssets,
      customFolders,
      "Документ удален из каталога.",
      "Не удалось удалить документ из каталога."
    );
    if (isSaved) {
      setSelectedDocIds(prev => {
        const next = { ...prev };
        delete next[doc.id];
        return next;
      });
      setDeleteDocument(null);
    }
    setDeletingDocId(null);
  };

  const handleSelectFiles = () => {
    setUploadModalOpen(true);
    setUploadFolderMode("existing");
    const preselectFolder =
      selectedFolder !== "all" && selectedFolder !== uncategorizedFolderKey ? selectedFolder : "";
    setUploadExistingFolder(preselectFolder);
    setUploadNewFolderName("");
    setPendingUploadFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const uploadFiles = async (files: File[], targetFolder: string) => {
    if (!files.length) return false;
    setUploading(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const normalizedFolder = normalizeFolderPath(targetFolder);
      const basePrefix = `assets/documents/rigs/${rigId}`;
      const uploadedAssets: MediaAsset[] = [];
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const uploadMoment = new Date().toISOString();
        const safeName = sanitizeFileName(file.name);
        const folderSuffix = normalizedFolder ? `${normalizedFolder}/` : "";
        const key = `${basePrefix}/${folderSuffix}${Date.now()}-${index}-${safeName}`;
        const uploadResponse = await uploadMediaAsset({
          key,
          file,
          contentType: file.type || "application/octet-stream",
          cacheControl: "public, max-age=31536000"
        });

        uploadedAssets.push({
          id: createAssetId(),
          name: file.name,
          group: normalizedFolder,
          type: "document",
          url: uploadResponse.publicUrl || "",
          key: uploadResponse.key,
          contentType: file.type || "application/octet-stream",
          uploadedAt: uploadMoment
        });
      }

      const nextAssets = [...assets, ...uploadedAssets];
      const nextFolders = sanitizeFolders([
        ...customFolders,
        ...(normalizedFolder ? [normalizedFolder] : [])
      ]);
      const isSaved = await persistCatalog(
        nextAssets,
        nextFolders,
        `Файлов загружено: ${uploadedAssets.length}.`,
        "Не удалось загрузить файлы. Проверьте доступ к media/minio."
      );
      if (!isSaved) return false;
      setSelectedFolder(normalizedFolder || uncategorizedFolderKey);
      return true;
    } catch {
      setActionError("Не удалось загрузить файлы. Проверьте доступ к media/minio.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setPendingUploadFiles(Array.from(event.target.files));
    }
  };

  const handleChooseUploadFiles = () => {
    fileInputRef.current?.click();
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setPendingUploadFiles([]);
    setUploadNewFolderName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const confirmUploadFromModal = async () => {
    if (pendingUploadFiles.length === 0) {
      setActionError("Сначала выберите хотя бы один файл для загрузки.");
      return;
    }
    const targetFolder =
      uploadFolderMode === "existing"
        ? normalizeFolderPath(uploadExistingFolder)
        : normalizeFolderPath(uploadNewFolderName);
    if (uploadFolderMode === "new" && !targetFolder) {
      setActionError("Введите имя новой папки.");
      return;
    }
    const isUploaded = await uploadFiles(pendingUploadFiles, targetFolder);
    if (isUploaded) {
      closeUploadModal();
    }
  };

  const handleBulkMove = async () => {
    const selectedIds = Object.keys(selectedDocIds).filter(id => selectedDocIds[id]);
    if (!selectedIds.length) {
      setActionError("Выберите хотя бы один документ для перемещения.");
      return;
    }
    const normalizedFolder = normalizeFolderPath(bulkMoveFolder);
    const selectedSet = new Set(selectedIds);
    const nextAssets = assets.map(asset =>
      selectedSet.has(asset.id) ? { ...asset, group: normalizedFolder } : asset
    );
    const nextFolders = sanitizeFolders([
      ...customFolders,
      ...(normalizedFolder ? [normalizedFolder] : [])
    ]);
    const isSaved = await persistCatalog(
      nextAssets,
      nextFolders,
      `Перемещено документов: ${selectedIds.length}.`,
      "Не удалось переместить выбранные документы."
    );
    if (isSaved) {
      setSelectedDocIds({});
      setSelectedFolder(normalizedFolder || uncategorizedFolderKey);
    }
  };

  const handleCreateFolder = () => {
    setNewFolderName("");
    setCreateFolderModalOpen(true);
    setFolderMenuPath(null);
  };

  const confirmCreateFolder = async () => {
    const folderName = normalizeFolderPath(newFolderName);
    if (!folderName) {
      setActionError("Название папки не должно быть пустым.");
      return;
    }
    const basePath =
      selectedFolder !== "all" && selectedFolder !== uncategorizedFolderKey ? selectedFolder : "";
    const fullPath = normalizeFolderPath(basePath ? `${basePath}/${folderName}` : folderName);
    if (!fullPath) return;
    if (customFolders.includes(fullPath)) {
      setActionError("Такая папка уже существует.");
      return;
    }

    const nextFolders = sanitizeFolders([...customFolders, fullPath]);
    const isSaved = await persistCatalog(
      assets,
      nextFolders,
      `Папка создана: ${fullPath}`,
      "Не удалось создать папку."
    );
    if (isSaved) {
      setSelectedFolder(fullPath);
      setExpandedFolders(prev => ({ ...prev, [fullPath]: true }));
      setCreateFolderModalOpen(false);
      setNewFolderName("");
    }
  };

  const handleRenameFolder = (folderPath: string) => {
    const currentName = folderPath.split("/").pop() || folderPath;
    setRenameFolderPath(folderPath);
    setRenameFolderName(currentName);
    setFolderMenuPath(null);
  };

  const confirmRenameFolder = async () => {
    const folderPath = renameFolderPath;
    if (!folderPath || folderPath === uncategorizedFolderKey) return;
    const normalizedInput = normalizeFolderPath(renameFolderName);
    if (!normalizedInput) {
      setActionError("Имя папки не должно быть пустым.");
      return;
    }

    const parent = folderPath.includes("/") ? folderPath.slice(0, folderPath.lastIndexOf("/")) : "";
    const nextPath = normalizedInput.includes("/")
      ? normalizedInput
      : normalizeFolderPath(parent ? `${parent}/${normalizedInput}` : normalizedInput);
    if (!nextPath || nextPath === folderPath) return;
    if (nextPath.startsWith(`${folderPath}/`)) {
      setActionError("Нельзя переименовать папку внутрь самой себя.");
      return;
    }
    if (folderTree.nodes[nextPath] && !nextPath.startsWith(`${folderPath}/`)) {
      setActionError("Папка с таким именем уже существует.");
      return;
    }

    const nextAssets = assets.map(asset => ({
      ...asset,
      group: remapFolderPath(asset.group || "", folderPath, nextPath)
    }));
    const nextFolders = sanitizeFolders(
      customFolders.map(item => remapFolderPath(item, folderPath, nextPath))
    );
    const isSaved = await persistCatalog(
      nextAssets,
      nextFolders,
      `Папка переименована: ${nextPath}`,
      "Не удалось переименовать папку."
    );
    if (isSaved) {
      if (selectedFolder === folderPath || selectedFolder.startsWith(`${folderPath}/`)) {
        setSelectedFolder(remapFolderPath(selectedFolder, folderPath, nextPath));
      }
      setExpandedFolders(prev => {
        const next: Record<string, boolean> = {};
        Object.entries(prev).forEach(([key, value]) => {
          next[remapFolderPath(key, folderPath, nextPath)] = value;
        });
        return next;
      });
      setRenameFolderPath(null);
      setRenameFolderName("");
    }
  };

  const handleDeleteFolder = (folderPath: string) => {
    setDeleteFolderPath(folderPath);
    setFolderMenuPath(null);
  };

  const confirmDeleteFolder = async () => {
    const folderPath = deleteFolderPath;
    if (!folderPath || folderPath === uncategorizedFolderKey) return;
    const node = folderTree.nodes[folderPath];
    if (!node) return;
    if (node.totalCount > 0) {
      setActionError("Можно удалить только пустую папку.");
      return;
    }
    const nextFolders = sanitizeFolders(
      customFolders.filter(item => item !== folderPath && !item.startsWith(`${folderPath}/`))
    );
    const isSaved = await persistCatalog(
      assets,
      nextFolders,
      `Папка удалена: ${folderPath}`,
      "Не удалось удалить папку."
    );
    if (isSaved) {
      if (selectedFolder === folderPath || selectedFolder.startsWith(`${folderPath}/`)) {
        setSelectedFolder("all");
      }
      setDeleteFolderPath(null);
    }
  };

  const closeCreateFolderModal = () => {
    setCreateFolderModalOpen(false);
    setNewFolderName("");
  };

  const closeRenameFolderModal = () => {
    setRenameFolderPath(null);
    setRenameFolderName("");
  };

  const closeDeleteFolderModal = () => {
    setDeleteFolderPath(null);
  };

  const closeDeleteDocumentModal = () => {
    setDeleteDocument(null);
  };

  const isAnyModalOpen =
    createFolderModalOpen ||
    Boolean(renameFolderPath) ||
    Boolean(deleteFolderPath) ||
    Boolean(deleteDocument) ||
    uploadModalOpen;

  useModalKeyboardActions({
    isAnyModalOpen,
    uploadModalOpen,
    deleteDocumentOpen: Boolean(deleteDocument),
    deleteFolderOpen: Boolean(deleteFolderPath),
    renameFolderOpen: Boolean(renameFolderPath),
    createFolderOpen: createFolderModalOpen,
    uploading,
    deletingDocId,
    onCloseUpload: closeUploadModal,
    onCloseDeleteDocument: closeDeleteDocumentModal,
    onCloseDeleteFolder: closeDeleteFolderModal,
    onCloseRenameFolder: closeRenameFolderModal,
    onCloseCreateFolder: closeCreateFolderModal,
    onConfirmUpload: confirmUploadFromModal,
    onConfirmDeleteDocument: confirmDeleteDocument,
    onConfirmDeleteFolder: confirmDeleteFolder,
    onConfirmRenameFolder: confirmRenameFolder,
    onConfirmCreateFolder: confirmCreateFolder
  });

  const handleFolderDrop = async (targetFolder: string) => {
    if (draggingFolderPath || !draggingDocIds.length) return;
    const normalizedTarget =
      targetFolder === uncategorizedFolderKey ? "" : normalizeFolderPath(targetFolder);
    const selectedSet = new Set(draggingDocIds);
    const nextAssets = assets.map(asset =>
      selectedSet.has(asset.id) ? { ...asset, group: normalizedTarget } : asset
    );
    const nextFolders = sanitizeFolders([
      ...customFolders,
      ...(normalizedTarget ? [normalizedTarget] : [])
    ]);
    const isSaved = await persistCatalog(
      nextAssets,
      nextFolders,
      `Перемещено документов: ${draggingDocIds.length}.`,
      "Не удалось переместить документы в папку."
    );
    if (isSaved) {
      setSelectedDocIds({});
      setSelectedFolder(normalizedTarget || uncategorizedFolderKey);
    }
  };

  const handleMoveFolderByDrag = async (sourcePath: string, targetPath: string) => {
    if (!sourcePath || sourcePath === uncategorizedFolderKey) return;
    if (targetPath === uncategorizedFolderKey) {
      setActionError("Нельзя перемещать папку в 'Без папки'.");
      return;
    }
    if (sourcePath === targetPath) return;
    if (targetPath && targetPath.startsWith(`${sourcePath}/`)) {
      setActionError("Нельзя переместить папку внутрь самой себя.");
      return;
    }

    const sourceName = sourcePath.split("/").pop() || sourcePath;
    const destinationRoot = targetPath ? normalizeFolderPath(targetPath) : "";
    const nextRootPath = normalizeFolderPath(
      destinationRoot ? `${destinationRoot}/${sourceName}` : sourceName
    );
    if (!nextRootPath || nextRootPath === sourcePath) return;
    if (folderTree.nodes[nextRootPath] && !nextRootPath.startsWith(`${sourcePath}/`)) {
      setActionError("В папке назначения уже есть папка с таким именем.");
      return;
    }

    const nextAssets = assets.map(asset => ({
      ...asset,
      group: remapFolderPath(asset.group || "", sourcePath, nextRootPath)
    }));
    const nextFolders = sanitizeFolders(
      customFolders.map(item => remapFolderPath(item, sourcePath, nextRootPath))
    );
    const isSaved = await persistCatalog(
      nextAssets,
      nextFolders,
      `Папка перемещена: ${nextRootPath}`,
      "Не удалось переместить папку."
    );
    if (isSaved) {
      if (selectedFolder === sourcePath || selectedFolder.startsWith(`${sourcePath}/`)) {
        setSelectedFolder(remapFolderPath(selectedFolder, sourcePath, nextRootPath));
      }
      setExpandedFolders(prev => {
        const next: Record<string, boolean> = {};
        Object.entries(prev).forEach(([key, value]) => {
          next[remapFolderPath(key, sourcePath, nextRootPath)] = value;
        });
        return next;
      });
    }
  };

  useEffect(() => {
    setSelectedDocIds(prev => {
      const existing = new Set(assets.map(asset => asset.id));
      const next: Record<string, boolean> = {};
      let changed = false;
      Object.entries(prev).forEach(([id, value]) => {
        if (existing.has(id) && value) {
          next[id] = true;
        } else if (value) {
          changed = true;
        }
      });
      if (!changed && Object.keys(next).length === Object.keys(prev).length) {
        return prev;
      }
      return next;
    });
  }, [assets, setSelectedDocIds]);

  return {
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
  };
}
