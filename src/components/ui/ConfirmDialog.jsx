import Modal from "./Modal";

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "O'chirish",
  isPending = false,
  onConfirm,
  onClose,
}) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-base-content/70">{description}</p>
      <div className="modal-action">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isPending}>
          Bekor qilish
        </button>
        <button type="button" className="btn btn-error" onClick={onConfirm} disabled={isPending}>
          {isPending && <span className="loading loading-spinner loading-sm" />}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}

export default ConfirmDialog;
