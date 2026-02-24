import type { DragEvent } from "react";
import type { FolderTreeNode } from "./useDocumentsCatalog";

interface DocumentsFolderTreeVm {
  folderTree: { nodes: Record<string, FolderTreeNode>; rootPaths: string[] };
  expandedFolders: Record<string, boolean>;
  selectedFolder: string;
  dragOverFolder: string | null;
  draggingDocIds: string[];
  draggingFolderPath: string | null;
  folderMenuPath: string | null;
  filteredDocuments: number;
  uncategorizedFolderKey: string;
  savingCatalog: boolean;
  uploading: boolean;
  onSelectFolder: (path: string) => void;
  onSetDragOverFolder: (path: string | null) => void;
  onSetDraggingFolderPath: (path: string | null) => void;
  onToggleFolder: (path: string) => void;
  onToggleFolderMenu: (path: string) => void;
  onCreateFolder: () => void;
  onRenameFolder: (path: string) => void;
  onDeleteFolder: (path: string) => void;
  onFolderDrop: (targetFolder: string) => Promise<void>;
  onMoveFolderByDrag: (sourcePath: string, targetPath: string) => Promise<void>;
  onDragEnd: () => void;
}

interface DocumentsFolderTreeProps {
  vm: DocumentsFolderTreeVm;
}

export default function DocumentsFolderTree({ vm }: DocumentsFolderTreeProps) {
  const {
    folderTree,
    expandedFolders,
    selectedFolder,
    dragOverFolder,
    draggingDocIds,
    draggingFolderPath,
    folderMenuPath,
    filteredDocuments,
    uncategorizedFolderKey,
    savingCatalog,
    uploading,
    onSelectFolder,
    onSetDragOverFolder,
    onSetDraggingFolderPath,
    onToggleFolder,
    onToggleFolderMenu,
    onCreateFolder,
    onRenameFolder,
    onDeleteFolder,
    onFolderDrop,
    onMoveFolderByDrag,
    onDragEnd
  } = vm;

  const renderFolderTreeNode = (path: string) => {
    const node = folderTree.nodes[path];
    if (!node) return null;
    const isExpanded = expandedFolders[path];
    const isSelected = selectedFolder === path;
    const hasChildren = node.children.length > 0;
    const canShowFolderMenu = path !== uncategorizedFolderKey;
    return (
      <div key={path} className="documents-tree-node">
        <button
          type="button"
          className={`documents-tree-item${isSelected ? " active" : ""}${
            dragOverFolder === path ? " drop-target" : ""
          }`}
          style={{ paddingLeft: `${10 + node.depth * 14}px` }}
          onClick={() => onSelectFolder(path)}
          onDragOver={event => {
            if (!draggingDocIds.length && !draggingFolderPath) return;
            event.preventDefault();
            onSetDragOverFolder(path);
          }}
          onDragLeave={() => {
            if (dragOverFolder === path) {
              onSetDragOverFolder(null);
            }
          }}
          onDrop={async event => {
            event.preventDefault();
            onSetDragOverFolder(null);
            if (draggingFolderPath) {
              await onMoveFolderByDrag(draggingFolderPath, path);
              return;
            }
            await onFolderDrop(path);
          }}
          draggable={canShowFolderMenu}
          onDragStart={(event: DragEvent<HTMLButtonElement>) => {
            if (!canShowFolderMenu) return;
            onSetDraggingFolderPath(path);
            event.dataTransfer.effectAllowed = "move";
            event.dataTransfer.setData("text/plain", path);
          }}
          onDragEnd={onDragEnd}
        >
          {hasChildren ? (
            <span
              className="documents-tree-expand"
              onClick={event => {
                event.stopPropagation();
                onToggleFolder(path);
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
                onToggleFolderMenu(path);
              }}
            />
          )}
        </button>
        {folderMenuPath === path && canShowFolderMenu && (
          <div className="documents-tree-menu">
            <button type="button" onClick={() => onRenameFolder(path)}>
              Переименовать
            </button>
            <button type="button" onClick={() => onDeleteFolder(path)}>
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
    <aside className="documents-tree-panel">
      <div className="documents-tree-header">
        <span>Папки</span>
        <button
          type="button"
          className="document-card-link secondary"
          onClick={onCreateFolder}
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
        onClick={() => onSelectFolder("all")}
        onDragOver={event => {
          if (!draggingFolderPath) return;
          event.preventDefault();
          onSetDragOverFolder("all");
        }}
        onDragLeave={() => {
          if (dragOverFolder === "all") {
            onSetDragOverFolder(null);
          }
        }}
        onDrop={async event => {
          event.preventDefault();
          onSetDragOverFolder(null);
          if (draggingFolderPath) {
            await onMoveFolderByDrag(draggingFolderPath, "");
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
  );
}
