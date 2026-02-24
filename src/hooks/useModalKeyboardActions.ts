import { useEffect } from "react";

interface UseModalKeyboardActionsParams {
  isAnyModalOpen: boolean;
  uploadModalOpen: boolean;
  deleteDocumentOpen: boolean;
  deleteFolderOpen: boolean;
  renameFolderOpen: boolean;
  createFolderOpen: boolean;
  uploading: boolean;
  deletingDocId: string | null;
  onCloseUpload: () => void;
  onCloseDeleteDocument: () => void;
  onCloseDeleteFolder: () => void;
  onCloseRenameFolder: () => void;
  onCloseCreateFolder: () => void;
  onConfirmUpload: () => Promise<void> | void;
  onConfirmDeleteDocument: () => Promise<void> | void;
  onConfirmDeleteFolder: () => Promise<void> | void;
  onConfirmRenameFolder: () => Promise<void> | void;
  onConfirmCreateFolder: () => Promise<void> | void;
}

export function useModalKeyboardActions(params: UseModalKeyboardActionsParams) {
  const {
    isAnyModalOpen,
    uploadModalOpen,
    deleteDocumentOpen,
    deleteFolderOpen,
    renameFolderOpen,
    createFolderOpen,
    uploading,
    deletingDocId,
    onCloseUpload,
    onCloseDeleteDocument,
    onCloseDeleteFolder,
    onCloseRenameFolder,
    onCloseCreateFolder,
    onConfirmUpload,
    onConfirmDeleteDocument,
    onConfirmDeleteFolder,
    onConfirmRenameFolder,
    onConfirmCreateFolder,
  } = params;

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.isComposing) return;
      if (event.key === "Escape") {
        event.preventDefault();
        if (uploadModalOpen) return onCloseUpload();
        if (deleteDocumentOpen) return onCloseDeleteDocument();
        if (deleteFolderOpen) return onCloseDeleteFolder();
        if (renameFolderOpen) return onCloseRenameFolder();
        if (createFolderOpen) onCloseCreateFolder();
        return;
      }

      if (event.key !== "Enter" || event.shiftKey || event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }
      event.preventDefault();
      if (uploadModalOpen && !uploading) return void onConfirmUpload();
      if (deleteDocumentOpen && !deletingDocId) return void onConfirmDeleteDocument();
      if (deleteFolderOpen) return void onConfirmDeleteFolder();
      if (renameFolderOpen) return void onConfirmRenameFolder();
      if (createFolderOpen) return void onConfirmCreateFolder();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    isAnyModalOpen,
    uploadModalOpen,
    deleteDocumentOpen,
    deleteFolderOpen,
    renameFolderOpen,
    createFolderOpen,
    uploading,
    deletingDocId,
    onCloseUpload,
    onCloseDeleteDocument,
    onCloseDeleteFolder,
    onCloseRenameFolder,
    onCloseCreateFolder,
    onConfirmUpload,
    onConfirmDeleteDocument,
    onConfirmDeleteFolder,
    onConfirmRenameFolder,
    onConfirmCreateFolder,
  ]);
}
