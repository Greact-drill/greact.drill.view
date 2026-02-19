import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  getMediaConfig,
  getMediaDownloadUrl,
  putMediaConfig,
  uploadMediaAsset
} from "../../api/media";
import "./DocumentsPage.css";

interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: "image" | "video" | "document";
  url?: string;
  key?: string;
  contentType?: string;
}

interface DocumentsConfigData {
  assets?: MediaAsset[];
  folders?: string[];
}

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

const sanitizeAssets = (items: MediaAsset[]): MediaAsset[] => {
  return items
    .map(asset => ({
      id: String(asset.id || "").trim(),
      name: asset.name?.trim() || "",
      group: normalizeFolderPath(asset.group),
      type: "document" as const,
      url: asset.url?.trim() || "",
      key: asset.key?.trim() || "",
      contentType: asset.contentType?.trim() || ""
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

interface FolderTreeNode {
  path: string;
  name: string;
  parent: string | null;
  depth: number;
  children: string[];
  directCount: number;
  totalCount: number;
}

export default function DocumentsPage() {
  const params = useParams();
  const rigId = params.rigId || "14820";
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [uploadFolder, setUploadFolder] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkMoveFolder, setBulkMoveFolder] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<Record<string, boolean>>({});
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [draggingDocIds, setDraggingDocIds] = useState<string[]>([]);
  const [draggingFolderPath, setDraggingFolderPath] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [folderMenuPath, setFolderMenuPath] = useState<string | null>(null);
  const [createFolderModalOpen, setCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [renameFolderPath, setRenameFolderPath] = useState<string | null>(null);
  const [renameFolderName, setRenameFolderName] = useState("");
  const [deleteFolderPath, setDeleteFolderPath] = useState<string | null>(null);
  const [deleteDocument, setDeleteDocument] = useState<MediaAsset | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    let isActive = true;
    const loadDocuments = async () => {
      setLoading(true);
      setErrorMessage(null);
      try {
        const config = await getMediaConfig<DocumentsConfigData>("documents", rigId);
        const normalized = sanitizeAssets(config.data?.assets ?? []);
        if (isActive) {
          setAssets(normalized);
          setCustomFolders(sanitizeFolders(config.data?.folders ?? []));
        }
      } catch {
        if (isActive) {
          setErrorMessage("Не удалось загрузить документы для выбранной буровой.");
          setAssets([]);
          setCustomFolders([]);
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    loadDocuments();
    return () => {
      isActive = false;
    };
  }, [rigId]);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return assets;
    }
    return assets.filter(asset => {
      const fileName = asset.name?.toLowerCase() || "";
      const contentType = asset.contentType?.toLowerCase() || "";
      const folderName = normalizeFolderPath(asset.group).toLowerCase();
      return fileName.includes(query) || contentType.includes(query) || folderName.includes(query);
    });
  }, [assets, searchQuery]);

  const folderTree = useMemo(() => {
    const nodeMap = new Map<
      string,
      {
        path: string;
        name: string;
        parent: string | null;
        depth: number;
        children: Set<string>;
        directCount: number;
        totalCount: number;
      }
    >();

    const ensureNode = (path: string, name: string, depth: number, parent: string | null) => {
      if (!nodeMap.has(path)) {
        nodeMap.set(path, {
          path,
          name,
          parent,
          depth,
          children: new Set<string>(),
          directCount: 0,
          totalCount: 0
        });
      }
      return nodeMap.get(path)!;
    };

    const addFolderPath = (sourcePath: string) => {
      const folderPath = normalizeFolderPath(sourcePath);
      if (!folderPath) return;
      const segments = folderPath.split("/");
      let currentPath = "";
      let parentPath: string | null = null;
      segments.forEach((segment, index) => {
        currentPath = currentPath ? `${currentPath}/${segment}` : segment;
        ensureNode(currentPath, segment, index, parentPath);
        if (parentPath) {
          const parentNode = ensureNode(
            parentPath,
            parentPath.split("/").pop() || parentPath,
            index - 1,
            null
          );
          parentNode.children.add(currentPath);
        }
        parentPath = currentPath;
      });
    };

    for (const asset of assets) {
      const folderPath = normalizeFolderPath(asset.group);
      if (!folderPath) {
        const node = ensureNode(UNCATEGORIZED_FOLDER_KEY, DEFAULT_FOLDER_NAME, 0, null);
        node.directCount += 1;
        continue;
      }
      addFolderPath(folderPath);
      const folderNode = nodeMap.get(folderPath);
      if (folderNode) {
        folderNode.directCount += 1;
      }
    }

    for (const folderPath of customFolders) {
      addFolderPath(folderPath);
    }

    const calculateTotal = (path: string): number => {
      const node = nodeMap.get(path);
      if (!node) return 0;
      const childrenTotal = Array.from(node.children).reduce((sum, childPath) => {
        return sum + calculateTotal(childPath);
      }, 0);
      node.totalCount = node.directCount + childrenTotal;
      return node.totalCount;
    };

    const rootPaths = Array.from(nodeMap.values())
      .filter(node => !node.parent)
      .map(node => node.path);

    rootPaths.forEach(rootPath => {
      calculateTotal(rootPath);
    });

    const sortedRootPaths = [...rootPaths].sort((left, right) => {
      if (left === UNCATEGORIZED_FOLDER_KEY) return 1;
      if (right === UNCATEGORIZED_FOLDER_KEY) return -1;
      return left.localeCompare(right, "ru");
    });

    const nodes: Record<string, FolderTreeNode> = {};
    nodeMap.forEach(node => {
      nodes[node.path] = {
        path: node.path,
        name: node.name,
        parent: node.parent,
        depth: node.depth,
        children: Array.from(node.children).sort((left, right) => left.localeCompare(right, "ru")),
        directCount: node.directCount,
        totalCount: node.totalCount
      };
    });

    return { nodes, rootPaths: sortedRootPaths };
  }, [assets, customFolders]);

  useEffect(() => {
    setExpandedFolders(prev => {
      let changed = false;
      const next = { ...prev };
      for (const folderPath of Object.keys(folderTree.nodes)) {
        if (!(folderPath in next)) {
          next[folderPath] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [folderTree.nodes]);

  const totalDocuments = assets.length;
  const filteredDocuments = filteredAssets.length;
  const uniqueFoldersCount = useMemo(() => {
    const folderSet = new Set<string>();
    for (const folderPath of customFolders) {
      folderSet.add(normalizeFolderPath(folderPath) || UNCATEGORIZED_FOLDER_KEY);
    }
    for (const asset of assets) {
      const folderPath = normalizeFolderPath(asset.group);
      folderSet.add(folderPath || UNCATEGORIZED_FOLDER_KEY);
    }
    return folderSet.size;
  }, [assets, customFolders]);

  const visibleDocuments = useMemo(() => {
    if (selectedFolder === "all") {
      return filteredAssets;
    }
    if (selectedFolder === UNCATEGORIZED_FOLDER_KEY) {
      return filteredAssets.filter(asset => !normalizeFolderPath(asset.group));
    }
    return filteredAssets.filter(asset => {
      const folderPath = normalizeFolderPath(asset.group);
      return folderPath === selectedFolder || folderPath.startsWith(`${selectedFolder}/`);
    });
  }, [filteredAssets, selectedFolder]);

  const selectedCount = useMemo(() => {
    return Object.values(selectedDocIds).filter(Boolean).length;
  }, [selectedDocIds]);

  const selectedVisibleCount = useMemo(() => {
    return visibleDocuments.filter(doc => selectedDocIds[doc.id]).length;
  }, [selectedDocIds, visibleDocuments]);

  const resolveDocumentUrl = (doc: MediaAsset) => {
    if (doc.key) {
      return getMediaDownloadUrl(doc.key);
    }
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

  const fetchDocumentBlob = async (doc: MediaAsset) => {
    const url = resolveDocumentUrl(doc);
    if (!url) throw new Error("missing-url");
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`failed-${response.status}`);
    }
    const blob = await response.blob();
    return {
      blob,
      filename: resolveFileName(doc)
    };
  };

  const persistCatalog = async (
    nextAssets: MediaAsset[],
    nextFolders: string[],
    successText: string,
    errorText: string
  ) => {
    setSavingCatalog(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      await putMediaConfig<DocumentsConfigData>("documents", rigId, {
        assets: sanitizeAssets(nextAssets),
        folders: sanitizeFolders(nextFolders)
      });
      setAssets(nextAssets);
      setCustomFolders(sanitizeFolders(nextFolders));
      setSuccessMessage(successText);
      window.setTimeout(() => setSuccessMessage(null), 3500);
      return true;
    } catch {
      setActionError(errorText);
      return false;
    } finally {
      setSavingCatalog(false);
    }
  };

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

  const handleToggleFolder = (folderPath: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderPath]: !prev[folderPath]
    }));
  };

  const handleDocumentFolderChange = (docId: string, folder: string) => {
    setAssets(prev =>
      prev.map(asset => (asset.id === docId ? { ...asset, group: folder } : asset))
    );
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
    fileInputRef.current?.click();
  };

  const uploadFiles = async (files: FileList) => {
    if (!files.length) return;
    setUploading(true);
    setActionError(null);
    setSuccessMessage(null);
    try {
      const normalizedFolder = normalizeFolderPath(uploadFolder);
      const basePrefix = `assets/documents/rigs/${rigId}`;
      const uploadedAssets: MediaAsset[] = [];
      const uploadList = Array.from(files);

      for (let index = 0; index < uploadList.length; index += 1) {
        const file = uploadList[index];
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
          contentType: file.type || "application/octet-stream"
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
      if (!isSaved) return;
      if (normalizedFolder) {
        setSelectedFolder(normalizedFolder);
      }
    } catch {
      setActionError("Не удалось загрузить файлы. Проверьте доступ к media/minio.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      uploadFiles(event.target.files);
    }
  };

  const handleToggleDocumentSelection = (docId: string) => {
    setSelectedDocIds(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const handleSelectAllVisible = (checked: boolean) => {
    setSelectedDocIds(prev => {
      const next = { ...prev };
      for (const doc of visibleDocuments) {
        next[doc.id] = checked;
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedDocIds({});
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
      setSelectedFolder(normalizedFolder || UNCATEGORIZED_FOLDER_KEY);
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
      selectedFolder !== "all" && selectedFolder !== UNCATEGORIZED_FOLDER_KEY
        ? selectedFolder
        : "";
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
    if (!folderPath || folderPath === UNCATEGORIZED_FOLDER_KEY) return;
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
    if (!folderPath || folderPath === UNCATEGORIZED_FOLDER_KEY) return;
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
    createFolderModalOpen || Boolean(renameFolderPath) || Boolean(deleteFolderPath) || Boolean(deleteDocument);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (deleteDocument) {
          closeDeleteDocumentModal();
          return;
        }
        if (deleteFolderPath) {
          closeDeleteFolderModal();
          return;
        }
        if (renameFolderPath) {
          closeRenameFolderModal();
          return;
        }
        if (createFolderModalOpen) {
          closeCreateFolderModal();
        }
        return;
      }

      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      if (deleteDocument && !deletingDocId) {
        void confirmDeleteDocument();
        return;
      }
      if (deleteFolderPath) {
        void confirmDeleteFolder();
        return;
      }
      if (renameFolderPath) {
        void confirmRenameFolder();
        return;
      }
      if (createFolderModalOpen) {
        void confirmCreateFolder();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isAnyModalOpen,
    createFolderModalOpen,
    renameFolderPath,
    deleteFolderPath,
    deleteDocument,
    deletingDocId,
    confirmCreateFolder,
    confirmRenameFolder,
    confirmDeleteFolder,
    confirmDeleteDocument
  ]);

  const handleFolderDrop = async (targetFolder: string) => {
    if (draggingFolderPath) return;
    if (!draggingDocIds.length) return;
    const normalizedTarget =
      targetFolder === UNCATEGORIZED_FOLDER_KEY ? "" : normalizeFolderPath(targetFolder);
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
      setSelectedFolder(normalizedTarget || UNCATEGORIZED_FOLDER_KEY);
    }
  };

  const handleMoveFolderByDrag = async (sourcePath: string, targetPath: string) => {
    if (!sourcePath || sourcePath === UNCATEGORIZED_FOLDER_KEY) return;
    if (targetPath === UNCATEGORIZED_FOLDER_KEY) {
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

  const handleDragStart = (event: DragEvent<HTMLDivElement>, docId: string) => {
    const selectedIds = Object.keys(selectedDocIds).filter(id => selectedDocIds[id]);
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
  }, [assets]);

  const renderFolderTreeNode = (path: string) => {
    const node = folderTree.nodes[path];
    if (!node) return null;
    const isExpanded = expandedFolders[path];
    const isSelected = selectedFolder === path;
    const hasChildren = node.children.length > 0;
    const canShowFolderMenu = path !== UNCATEGORIZED_FOLDER_KEY;
    return (
      <div key={path} className="documents-tree-node">
        <button
          type="button"
          className={`documents-tree-item${isSelected ? " active" : ""}${
            dragOverFolder === path ? " drop-target" : ""
          }`}
          style={{ paddingLeft: `${10 + node.depth * 14}px` }}
          onClick={() => setSelectedFolder(path)}
          onDragOver={event => {
            if (!draggingDocIds.length && !draggingFolderPath) return;
            event.preventDefault();
            setDragOverFolder(path);
          }}
          onDragLeave={() => {
            if (dragOverFolder === path) {
              setDragOverFolder(null);
            }
          }}
          onDrop={async event => {
            event.preventDefault();
            setDragOverFolder(null);
            if (draggingFolderPath) {
              await handleMoveFolderByDrag(draggingFolderPath, path);
              return;
            }
            await handleFolderDrop(path);
          }}
          draggable={canShowFolderMenu}
          onDragStart={event => {
            if (!canShowFolderMenu) return;
            setDraggingFolderPath(path);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", path);
          }}
          onDragEnd={handleDragEnd}
        >
          {hasChildren ? (
            <span
              className="documents-tree-expand"
              onClick={event => {
                event.stopPropagation();
                handleToggleFolder(path);
              }}
            >
              <i className={`pi ${isExpanded ? "pi-chevron-down" : "pi-chevron-right"}`} />
            </span>
          ) : (
            <span className="documents-tree-expand empty" />
          )}
          <i className="pi pi-folder documents-tree-icon" />
          <span className="documents-tree-name">{node.name}</span>
          <span className="documents-tree-count">{node.totalCount}</span>
          {canShowFolderMenu && (
            <span
              className="documents-tree-more pi pi-ellipsis-v"
              onClick={event => {
                event.stopPropagation();
                setFolderMenuPath(prev => (prev === path ? null : path));
              }}
            />
          )}
        </button>
        {folderMenuPath === path && canShowFolderMenu && (
          <div className="documents-tree-menu">
            <button type="button" onClick={() => handleRenameFolder(path)}>
              Переименовать
            </button>
            <button type="button" onClick={() => handleDeleteFolder(path)}>
              Удалить пустую
            </button>
          </div>
        )}
        {hasChildren && isExpanded && (
          <div className="documents-tree-children">
            {node.children.map(childPath => renderFolderTreeNode(childPath))}
          </div>
        )}
      </div>
    );
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
              <div className="documents-field">
                <label htmlFor="documents-upload-folder">Папка для загрузки</label>
                <input
                  id="documents-upload-folder"
                  type="text"
                  value={uploadFolder}
                  onChange={event => setUploadFolder(event.target.value)}
                  placeholder="Напр. Техпаспорта/2026"
                />
              </div>
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

          {loading && <div className="documents-empty">Загрузка документов...</div>}
          {!loading && errorMessage && <div className="documents-error">{errorMessage}</div>}
          {!loading && actionError && <div className="documents-error">{actionError}</div>}
          {!loading && successMessage && <div className="documents-success">{successMessage}</div>}
          {!loading && !errorMessage && totalDocuments === 0 && (
            <div className="documents-empty">
              Документы пока не добавлены. Загрузите их через форму выше.
            </div>
          )}

          {!loading && !errorMessage && totalDocuments > 0 && (
            <div className="documents-browser">
              <aside className="documents-tree-panel">
                <div className="documents-tree-header">
                  <span>Папки</span>
                  <button
                    type="button"
                    className="document-card-link secondary"
                    onClick={handleCreateFolder}
                    disabled={savingCatalog || uploading}
                  >
                    Новая папка
                  </button>
                </div>
                <button
                  type="button"
                  className={`documents-tree-item root${selectedFolder === "all" ? " active" : ""}${
                    dragOverFolder === "all" ? " drop-target" : ""
                  }`}
                  onClick={() => setSelectedFolder("all")}
                  onDragOver={event => {
                    if (!draggingFolderPath) return;
                    event.preventDefault();
                    setDragOverFolder("all");
                  }}
                  onDragLeave={() => {
                    if (dragOverFolder === "all") {
                      setDragOverFolder(null);
                    }
                  }}
                  onDrop={async event => {
                    event.preventDefault();
                    setDragOverFolder(null);
                    if (draggingFolderPath) {
                      await handleMoveFolderByDrag(draggingFolderPath, "");
                    }
                  }}
                >
                  <span className="documents-tree-expand empty" />
                  <i className="pi pi-folder-open documents-tree-icon" />
                  <span className="documents-tree-name">Все документы</span>
                  <span className="documents-tree-count">{filteredDocuments}</span>
                </button>
                {folderTree.rootPaths.map(path => renderFolderTreeNode(path))}
              </aside>
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
                        onChange={event => setBulkMoveFolder(event.target.value)}
                        placeholder="Новая папка (пусто = Без папки)"
                      />
                      <button
                        type="button"
                        className="document-card-link secondary"
                        onClick={handleBulkMove}
                        disabled={savingCatalog || uploading}
                      >
                        Переместить выбранные
                      </button>
                      <button
                        type="button"
                        className="document-card-link secondary"
                        onClick={handleClearSelection}
                      >
                        Снять выбор
                      </button>
                    </div>
                  </div>
                )}

                {visibleDocuments.length === 0 && (
                  <div className="documents-empty">Ничего не найдено по текущему фильтру.</div>
                )}

                {visibleDocuments.length > 0 && (
                  <div className="documents-file-list">
                    <div className="document-row document-row-header">
                      <div className="document-cell select">
                        <input
                          type="checkbox"
                          checked={
                            visibleDocuments.length > 0 &&
                            selectedVisibleCount === visibleDocuments.length
                          }
                          onChange={event => handleSelectAllVisible(event.target.checked)}
                        />
                      </div>
                      <div className="document-cell">Документ</div>
                      <div className="document-cell">Папка</div>
                      <div className="document-cell actions">Действия</div>
                    </div>
                    {visibleDocuments.map(doc => (
                      <div
                        className="document-row"
                        key={doc.id}
                        draggable
                        onDragStart={event => handleDragStart(event, doc.id)}
                        onDragEnd={handleDragEnd}
                      >
                        <div className="document-cell select">
                          <input
                            type="checkbox"
                            checked={Boolean(selectedDocIds[doc.id])}
                            onChange={() => handleToggleDocumentSelection(doc.id)}
                          />
                        </div>
                        <div className="document-cell">
                          <div className="document-row-title">{doc.name || doc.id}</div>
                          <div className="document-row-meta">{doc.contentType || "Документ"}</div>
                        </div>
                        <div className="document-cell">
                          <input
                            type="text"
                            value={doc.group || ""}
                            onChange={event => handleDocumentFolderChange(doc.id, event.target.value)}
                            placeholder="Без папки"
                            className="document-folder-input"
                          />
                        </div>
                        <div className="document-cell actions">
                          {resolveDocumentUrl(doc) ? (
                            <>
                              <button
                                type="button"
                                className={`document-card-link${busyDocId === doc.id ? " disabled" : ""}`}
                                onClick={() => handleOpen(doc)}
                                disabled={busyDocId === doc.id || deletingDocId === doc.id}
                              >
                                {busyDocId === doc.id ? "Открытие..." : "Открыть"}
                              </button>
                              <button
                                type="button"
                                className={`document-card-link secondary${busyDocId === doc.id ? " disabled" : ""}`}
                                onClick={() => handleDownload(doc)}
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
                            onClick={() => handleDeleteDocument(doc)}
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
              Используйте поле "Папка для загрузки" и формат вида "Раздел/Подраздел", чтобы
              быстро структурировать документы.
            </div>
          </div>
        </aside>
      </div>
      {createFolderModalOpen && (
        <div className="documents-modal-backdrop" onClick={closeCreateFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Новая папка</h3>
            <p>
              {selectedFolder !== "all" && selectedFolder !== UNCATEGORIZED_FOLDER_KEY
                ? `Будет создано в: ${selectedFolder}`
                : "Папка будет создана в корне каталога."}
            </p>
            <input
              type="text"
              value={newFolderName}
              onChange={event => setNewFolderName(event.target.value)}
              placeholder="Имя папки или путь с /"
              autoFocus
            />
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={closeCreateFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link"
                onClick={confirmCreateFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}
      {renameFolderPath && (
        <div className="documents-modal-backdrop" onClick={closeRenameFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Переименовать папку</h3>
            <p>Текущий путь: {renameFolderPath}</p>
            <input
              type="text"
              value={renameFolderName}
              onChange={event => setRenameFolderName(event.target.value)}
              placeholder="Новое имя папки"
              autoFocus
            />
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={closeRenameFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link"
                onClick={confirmRenameFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Сохранение..." : "Переименовать"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteFolderPath && (
        <div className="documents-modal-backdrop" onClick={closeDeleteFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Удалить папку</h3>
            <p>
              Удалить папку <strong>{deleteFolderPath}</strong>? Удаляются только пустые папки.
            </p>
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={closeDeleteFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link danger"
                onClick={confirmDeleteFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
      {deleteDocument && (
        <div className="documents-modal-backdrop" onClick={closeDeleteDocumentModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Удалить документ</h3>
            <p>
              Удалить из каталога документ <strong>{deleteDocument.name || deleteDocument.id}</strong>?
            </p>
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={closeDeleteDocumentModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link danger"
                onClick={confirmDeleteDocument}
                disabled={deletingDocId === deleteDocument.id || savingCatalog}
              >
                {deletingDocId === deleteDocument.id ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.rtf,.zip,.rar"
        onChange={handleFilesChange}
      />
    </div>
  );
}
