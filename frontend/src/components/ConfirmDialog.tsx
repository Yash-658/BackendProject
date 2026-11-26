import { ErrorBanner } from "./FeedbackStates";
import { Modal } from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = "Delete",
  isSubmitting = false,
  error = null,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} title={title} onClose={onCancel} disableClose={isSubmitting}>
      <p className="confirm-message">{message}</p>
      {error && <ErrorBanner message={error} />}
      <div className="modal-actions">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-danger"
          onClick={onConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Deleting..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
