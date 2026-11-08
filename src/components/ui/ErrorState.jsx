import { TriangleAlert } from "lucide-react";

function ErrorState({ error, onRetry }) {
  return (
    <div role="alert" className="alert alert-error alert-soft">
      <TriangleAlert className="size-5" />
      <span>{error?.message ?? "Ma'lumotlarni yuklab bo'lmadi"}</span>
      {onRetry && (
        <button type="button" className="btn btn-sm" onClick={onRetry}>
          Qayta urinish
        </button>
      )}
    </div>
  );
}

export default ErrorState;
