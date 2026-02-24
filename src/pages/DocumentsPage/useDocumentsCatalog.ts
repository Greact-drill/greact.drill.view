import { useEffect, useMemo, useState } from "react";
import { getMediaConfig, putMediaConfig } from "../../api/media";

export interface MediaAsset {
  id: string;
  name?: string;
  group?: string;
  type: "image" | "video" | "document";
  url?: string;
  key?: string;
  contentType?: string;
  uploadedAt?: string;
}

export interface DocumentsConfigData {
  assets?: MediaAsset[];
  folders?: string[];
}

export interface FolderTreeNode {
  path: string;
  name: string;
  parent: string | null;
  depth: number;
  children: string[];
  directCount: number;
  totalCount: number;
}

interface UseDocumentsCatalogParams {
  rigId: string;
  uncategorizedFolderKey: string;
  defaultFolderName: string;
  normalizeFolderPath: (rawValue?: string) => string;
  sanitizeAssets: (items: MediaAsset[]) => MediaAsset[];
  sanitizeFolders: (items: string[]) => string[];
}

export function useDocumentsCatalog(params: UseDocumentsCatalogParams) {
  const {
    rigId,
    uncategorizedFolderKey,
    defaultFolderName,
    normalizeFolderPath,
    sanitizeAssets,
    sanitizeFolders,
  } = params;

  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [bulkMoveFolder, setBulkMoveFolder] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState<Record<string, boolean>>({});
  const [customFolders, setCustomFolders] = useState<string[]>([]);
  const [draggingDocIds, setDraggingDocIds] = useState<string[]>([]);
  const [draggingFolderPath, setDraggingFolderPath] = useState<string | null>(null);
  const [dragOverFolder, setDragOverFolder] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});

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
        if (isActive) setLoading(false);
      }
    };

    loadDocuments();
    return () => {
      isActive = false;
    };
  }, [rigId, sanitizeAssets, sanitizeFolders]);

  const filteredAssets = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return assets;
    return assets.filter((asset) => {
      const fileName = asset.name?.toLowerCase() || "";
      const contentType = asset.contentType?.toLowerCase() || "";
      const folderName = normalizeFolderPath(asset.group).toLowerCase();
      return fileName.includes(query) || contentType.includes(query) || folderName.includes(query);
    });
  }, [assets, normalizeFolderPath, searchQuery]);

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
          totalCount: 0,
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
          const parentNode = ensureNode(parentPath, parentPath.split("/").pop() || parentPath, index - 1, null);
          parentNode.children.add(currentPath);
        }
        parentPath = currentPath;
      });
    };

    for (const asset of assets) {
      const folderPath = normalizeFolderPath(asset.group);
      if (!folderPath) {
        const node = ensureNode(uncategorizedFolderKey, defaultFolderName, 0, null);
        node.directCount += 1;
        continue;
      }
      addFolderPath(folderPath);
      const folderNode = nodeMap.get(folderPath);
      if (folderNode) folderNode.directCount += 1;
    }

    for (const folderPath of customFolders) addFolderPath(folderPath);

    const calculateTotal = (path: string): number => {
      const node = nodeMap.get(path);
      if (!node) return 0;
      const childrenTotal = Array.from(node.children).reduce((sum, childPath) => sum + calculateTotal(childPath), 0);
      node.totalCount = node.directCount + childrenTotal;
      return node.totalCount;
    };

    const rootPaths = Array.from(nodeMap.values())
      .filter((node) => !node.parent)
      .map((node) => node.path);
    rootPaths.forEach((rootPath) => calculateTotal(rootPath));

    const sortedRootPaths = [...rootPaths].sort((left, right) => {
      if (left === uncategorizedFolderKey) return 1;
      if (right === uncategorizedFolderKey) return -1;
      return left.localeCompare(right, "ru");
    });

    const nodes: Record<string, FolderTreeNode> = {};
    nodeMap.forEach((node) => {
      nodes[node.path] = {
        path: node.path,
        name: node.name,
        parent: node.parent,
        depth: node.depth,
        children: Array.from(node.children).sort((left, right) => left.localeCompare(right, "ru")),
        directCount: node.directCount,
        totalCount: node.totalCount,
      };
    });

    return { nodes, rootPaths: sortedRootPaths };
  }, [assets, customFolders, defaultFolderName, normalizeFolderPath, uncategorizedFolderKey]);

  useEffect(() => {
    setExpandedFolders((prev) => {
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
      folderSet.add(normalizeFolderPath(folderPath) || uncategorizedFolderKey);
    }
    for (const asset of assets) {
      const folderPath = normalizeFolderPath(asset.group);
      folderSet.add(folderPath || uncategorizedFolderKey);
    }
    return folderSet.size;
  }, [assets, customFolders, normalizeFolderPath, uncategorizedFolderKey]);

  const visibleDocuments = useMemo(() => {
    if (selectedFolder === "all") return filteredAssets;
    if (selectedFolder === uncategorizedFolderKey) {
      return filteredAssets.filter((asset) => !normalizeFolderPath(asset.group));
    }
    return filteredAssets.filter((asset) => {
      const folderPath = normalizeFolderPath(asset.group);
      return folderPath === selectedFolder || folderPath.startsWith(`${selectedFolder}/`);
    });
  }, [filteredAssets, normalizeFolderPath, selectedFolder, uncategorizedFolderKey]);

  const selectedCount = useMemo(() => Object.values(selectedDocIds).filter(Boolean).length, [selectedDocIds]);
  const selectedVisibleCount = useMemo(
    () => visibleDocuments.filter((doc) => selectedDocIds[doc.id]).length,
    [selectedDocIds, visibleDocuments]
  );
  const recentUploadFolders = useMemo(() => {
    const ranked = [...assets]
      .filter((asset) => Boolean(normalizeFolderPath(asset.group)))
      .sort((left, right) => {
        const leftTime = left.uploadedAt ? new Date(left.uploadedAt).getTime() : 0;
        const rightTime = right.uploadedAt ? new Date(right.uploadedAt).getTime() : 0;
        return rightTime - leftTime;
      });
    const unique = new Set<string>();
    const result: string[] = [];
    for (const asset of ranked) {
      const folder = normalizeFolderPath(asset.group);
      if (!folder || unique.has(folder)) continue;
      unique.add(folder);
      result.push(folder);
      if (result.length >= 5) break;
    }
    return result;
  }, [assets, normalizeFolderPath]);

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
        folders: sanitizeFolders(nextFolders),
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

  return {
    assets,
    setAssets,
    loading,
    errorMessage,
    setErrorMessage,
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
    setCustomFolders,
    draggingDocIds,
    setDraggingDocIds,
    draggingFolderPath,
    setDraggingFolderPath,
    dragOverFolder,
    setDragOverFolder,
    expandedFolders,
    setExpandedFolders,
    filteredAssets,
    folderTree,
    totalDocuments,
    filteredDocuments,
    uniqueFoldersCount,
    visibleDocuments,
    selectedCount,
    selectedVisibleCount,
    recentUploadFolders,
    persistCatalog,
  };
}
