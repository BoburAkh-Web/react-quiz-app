import { Link } from "react-router-dom";
import { ChartColumn, Clock, EllipsisVertical, ListChecks, Pencil, Trash2 } from "lucide-react";

function PublishBadge({ test }) {
  if (!test.is_published) return <span className="badge badge-ghost badge-sm">Qoralama</span>;
  if (test.question_count === 0) {
    return (
      <span className="badge badge-soft badge-sm badge-warning" title="Savol qo'shilmaguncha o'quvchilarga ko'rinmaydi">
        Savol yo'q
      </span>
    );
  }
  return (
    <span className="badge gap-1.5 badge-soft badge-sm badge-success">
      <span className="status status-success" /> Ochiq
    </span>
  );
}

function AdminTestCard({ test, onEdit, onDelete }) {
  return (
    <article className="surface flex flex-col rounded-box p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <PublishBadge test={test} />
          <h3 className="mt-2 line-clamp-2 text-lg leading-snug font-semibold">{test.title}</h3>
          {test.description && (
            <p className="mt-1 line-clamp-2 text-sm text-base-content/60">{test.description}</p>
          )}
        </div>

        <div className="dropdown dropdown-end shrink-0">
          <button type="button" tabIndex={0} className="btn btn-square btn-ghost btn-sm" aria-label="Amallar">
            <EllipsisVertical className="size-4" />
          </button>
          <ul tabIndex={0} className="dropdown-content menu surface z-10 w-44 rounded-box p-2">
            <li>
              <button type="button" onClick={() => onEdit(test)}>
                <Pencil className="size-4" /> Tahrirlash
              </button>
            </li>
            <li>
              <button type="button" className="text-error" onClick={() => onDelete(test)}>
                <Trash2 className="size-4" /> O'chirish
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-base-content/60">
        <span className="flex items-center gap-1.5">
          <ListChecks className="size-4" /> {test.question_count} savol
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="size-4" /> {test.seconds_per_question} s / savol
        </span>
        <span className="flex items-center gap-1.5">
          <ChartColumn className="size-4" /> {test.attempt_count} urinish
        </span>
      </div>

      <Link to={`/admin/tests/${test.id}`} className="btn mt-5 btn-soft btn-primary">
        Savollarni boshqarish
      </Link>
    </article>
  );
}

export default AdminTestCard;
