import { useEffect, useRef } from "react";
import { X } from "lucide-react";

// Brauzerning <dialog> elementi: fokus, Esc va orqa fon o'zidan ishlaydi.
// Telefonda pastdan chiqadigan oyna, kompyuterda markazda.
function Modal({ open, onClose, title, children, wide = false }) {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} className="modal modal-bottom sm:modal-middle" onClose={onClose}>
      <div className={`modal-box surface max-h-[90dvh] ${wide ? "sm:max-w-2xl" : ""}`}>
        <div className="mb-5 flex items-start justify-between gap-4">
          <h3 className="text-lg font-bold">{title}</h3>
          <button
            type="button"
            className="btn btn-circle btn-ghost btn-sm -mt-1 -mr-2"
            onClick={onClose}
            aria-label="Yopish"
          >
            <X className="size-4" />
          </button>
        </div>
        {/* Har ochilishda forma holati yangidan boshlanishi uchun */}
        {open && children}
      </div>
      <form method="dialog" className="modal-backdrop">
        <button type="submit">Yopish</button>
      </form>
    </dialog>
  );
}

export default Modal;
