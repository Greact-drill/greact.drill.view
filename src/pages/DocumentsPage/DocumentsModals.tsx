import { useState, type ChangeEvent, type DragEvent, type RefObject } from "react";
import type { FolderTreeNode, MediaAsset } from "./useDocumentsCatalog";

interface DocumentsModalsVm {
  folderTree: { nodes: Record<string, FolderTreeNode> };
  recentUploadFolders: string[];
  selectedFolder: string;
  uncategorizedFolderKey: string;
  uploading: boolean;
  savingCatalog: boolean;
  deletingDocId: string | null;
  uploadModalOpen: boolean;
  uploadFolderMode: "existing" | "new";
  uploadExistingFolder: string;
  uploadNewFolderName: string;
  pendingUploadFiles: File[];
  createFolderModalOpen: boolean;
  newFolderName: string;
  renameFolderPath: string | null;
  renameFolderName: string;
  deleteFolderPath: string | null;
  deleteDocument: MediaAsset | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onSetUploadFolderMode: (value: "existing" | "new") => void;
  onSetUploadExistingFolder: (value: string) => void;
  onSetUploadNewFolderName: (value: string) => void;
  onSetNewFolderName: (value: string) => void;
  onSetRenameFolderName: (value: string) => void;
  onCloseUploadModal: () => void;
  onConfirmUploadFromModal: () => Promise<void>;
  onChooseUploadFiles: () => void;
  onCloseCreateFolderModal: () => void;
  onConfirmCreateFolder: () => Promise<void>;
  onCloseRenameFolderModal: () => void;
  onConfirmRenameFolder: () => Promise<void>;
  onCloseDeleteFolderModal: () => void;
  onConfirmDeleteFolder: () => Promise<void>;
  onCloseDeleteDocumentModal: () => void;
  onConfirmDeleteDocument: () => Promise<void>;
  onFilesChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onDropUploadFiles: (files: File[]) => void;
}

interface DocumentsModalsProps {
  vm: DocumentsModalsVm;
}

export default function DocumentsModals({ vm }: DocumentsModalsProps) {
  const {
    folderTree,
    recentUploadFolders,
    selectedFolder,
    uncategorizedFolderKey,
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
    onSetUploadFolderMode,
    onSetUploadExistingFolder,
    onSetUploadNewFolderName,
    onSetNewFolderName,
    onSetRenameFolderName,
    onCloseUploadModal,
    onConfirmUploadFromModal,
    onChooseUploadFiles,
    onCloseCreateFolderModal,
    onConfirmCreateFolder,
    onCloseRenameFolderModal,
    onConfirmRenameFolder,
    onCloseDeleteFolderModal,
    onConfirmDeleteFolder,
    onCloseDeleteDocumentModal,
    onConfirmDeleteDocument,
    onFilesChange,
    onDropUploadFiles
  } = vm;
  const [isDropZoneActive, setIsDropZoneActive] = useState(false);

  const handleUploadDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDropZoneActive(true);
  };

  const handleUploadDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDropZoneActive(false);
    }
  };

  const handleUploadDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDropZoneActive(false);
    const files = Array.from(event.dataTransfer.files || []);
    if (files.length > 0) {
      onDropUploadFiles(files);
    }
  };

  return (
    <>
      {uploadModalOpen && (
        <div className="documents-modal-backdrop" onClick={onCloseUploadModal}>
          <div className="documents-modal documents-modal--upload" onClick={event => event.stopPropagation()}>
            <h3>Загрузка документов</h3>
            <p>Выберите папку назначения и добавьте один или несколько файлов.</p>
            <div className="documents-upload-mode">
              <button
                type="button"
                role="radio"
                aria-checked={uploadFolderMode === "existing"}
                className={`documents-upload-mode-option${uploadFolderMode === "existing" ? " active" : ""}`}
                onClick={() => onSetUploadFolderMode("existing")}
              >
                <i className="pi pi-folder" aria-hidden />
                <span>В существующую папку</span>
              </button>
              <button
                type="button"
                role="radio"
                aria-checked={uploadFolderMode === "new"}
                className={`documents-upload-mode-option${uploadFolderMode === "new" ? " active" : ""}`}
                onClick={() => onSetUploadFolderMode("new")}
              >
                <i className="pi pi-folder-plus" aria-hidden />
                <span>Создать новую папку</span>
              </button>
            </div>
            {uploadFolderMode === "existing" ? (
              <div className="documents-upload-field">
                <label htmlFor="upload-existing-folder">Папка</label>
                <select
                  id="upload-existing-folder"
                  value={uploadExistingFolder}
                  onChange={event => onSetUploadExistingFolder(event.target.value)}
                >
                  <option value="">Без папки</option>
                  {Object.keys(folderTree.nodes)
                    .filter(path => path !== uncategorizedFolderKey)
                    .sort((left, right) => left.localeCompare(right, "ru"))
                    .map(path => (
                      <option key={path} value={path}>
                        {path}
                      </option>
                    ))}
                </select>
                {recentUploadFolders.length > 0 && (
                  <div className="documents-upload-recent">
                    <span>Недавние:</span>
                    {recentUploadFolders.map(folder => (
                      <button
                        key={folder}
                        type="button"
                        className={`documents-upload-chip${uploadExistingFolder === folder ? " active" : ""}`}
                        onClick={() => onSetUploadExistingFolder(folder)}
                      >
                        {folder}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="documents-upload-field">
                <label htmlFor="upload-new-folder">Имя новой папки</label>
                <input
                  id="upload-new-folder"
                  type="text"
                  value={uploadNewFolderName}
                  onChange={event => onSetUploadNewFolderName(event.target.value)}
                  placeholder="Например: Техпаспорта/2026"
                  autoFocus
                />
              </div>
            )}
            <div
              className={`documents-upload-files${isDropZoneActive ? " drag-active" : ""}`}
              onDragOver={handleUploadDragOver}
              onDragLeave={handleUploadDragLeave}
              onDrop={handleUploadDrop}
            >
              <button
                type="button"
                className="document-card-link secondary"
                onClick={onChooseUploadFiles}
                disabled={uploading}
              >
                Выбрать файлы
              </button>
              <div className="documents-upload-files-info">
                {pendingUploadFiles.length > 0
                  ? `Выбрано файлов: ${pendingUploadFiles.length}`
                  : "Файлы пока не выбраны. Можно перетащить их сюда с рабочего стола."}
              </div>
            </div>
            {pendingUploadFiles.length > 0 && (
              <div className="documents-upload-files-list">
                {pendingUploadFiles.map(file => (
                  <div key={`${file.name}-${file.size}-${file.lastModified}`}>{file.name}</div>
                ))}
              </div>
            )}
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={onCloseUploadModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link"
                onClick={onConfirmUploadFromModal}
                disabled={uploading}
              >
                {uploading ? "Загрузка..." : "Загрузить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {createFolderModalOpen && (
        <div className="documents-modal-backdrop" onClick={onCloseCreateFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Новая папка</h3>
            <p>
              {selectedFolder !== "all" && selectedFolder !== uncategorizedFolderKey
                ? `Будет создано в: ${selectedFolder}`
                : "Папка будет создана в корне каталога."}
            </p>
            <input
              type="text"
              value={newFolderName}
              onChange={event => onSetNewFolderName(event.target.value)}
              placeholder="Имя папки или путь с /"
              autoFocus
            />
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={onCloseCreateFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link"
                onClick={onConfirmCreateFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Создание..." : "Создать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {renameFolderPath && (
        <div className="documents-modal-backdrop" onClick={onCloseRenameFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Переименовать папку</h3>
            <p>Текущий путь: {renameFolderPath}</p>
            <input
              type="text"
              value={renameFolderName}
              onChange={event => onSetRenameFolderName(event.target.value)}
              placeholder="Новое имя папки"
              autoFocus
            />
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={onCloseRenameFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link"
                onClick={onConfirmRenameFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Сохранение..." : "Переименовать"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteFolderPath && (
        <div className="documents-modal-backdrop" onClick={onCloseDeleteFolderModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Удалить папку</h3>
            <p>
              Удалить папку <strong>{deleteFolderPath}</strong>? Удаляются только пустые папки.
            </p>
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={onCloseDeleteFolderModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link danger"
                onClick={onConfirmDeleteFolder}
                disabled={savingCatalog}
              >
                {savingCatalog ? "Удаление..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteDocument && (
        <div className="documents-modal-backdrop" onClick={onCloseDeleteDocumentModal}>
          <div className="documents-modal" onClick={event => event.stopPropagation()}>
            <h3>Удалить документ</h3>
            <p>
              Удалить из каталога документ <strong>{deleteDocument.name || deleteDocument.id}</strong>?
            </p>
            <div className="documents-modal-actions">
              <button type="button" className="document-card-link secondary" onClick={onCloseDeleteDocumentModal}>
                Отмена
              </button>
              <button
                type="button"
                className="document-card-link danger"
                onClick={onConfirmDeleteDocument}
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
        onChange={onFilesChange}
      />
    </>
  );
}
