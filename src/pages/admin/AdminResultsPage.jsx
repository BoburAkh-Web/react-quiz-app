import { useState } from "react";
import { ChartColumn, ChevronRight, Repeat, Search, Trophy, Users } from "lucide-react";
import { useAdminResults, useAdminTests } from "../../hooks/useAdminData";
import { formatDateTime, scoreToneClasses } from "../../lib/utils";
import StudentHistoryModal from "../../components/admin/StudentHistoryModal";
import Avatar from "../../components/ui/Avatar";
import EmptyState from "../../components/ui/EmptyState";
import ErrorState from "../../components/ui/ErrorState";
import Loading from "../../components/ui/Loading";
import PageHeader from "../../components/ui/PageHeader";
import StatCard from "../../components/ui/StatCard";

const MEDALS = ["🥇", "🥈", "🥉"];

function Percent({ value }) {
  if (value == null) return <span className="text-base-content/40">—</span>;
  return <span className={`font-semibold ${scoreToneClasses(value).text}`}>{value}%</span>;
}

function StudentRow({ student, rank, onOpen }) {
  const hasAttempts = student.attempt_count > 0;

  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(student.id)}
        className="grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 sm:grid-cols-[2.5rem_1fr_7rem_7rem_9rem_1.5rem]"
      >
        <span className="text-center font-bold text-base-content/60">
          {rank <= 3 && student.best_percent ? MEDALS[rank - 1] : rank}
        </span>

        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={student.nickname} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-medium">{student.nickname}</span>
            <span className="block text-xs text-base-content/50">
              {hasAttempts ? `${student.attempt_count} ta urinish` : "Hali test ishlamagan"}
              <span className="sm:hidden">
                {student.last_finished_at && ` · ${formatDateTime(student.last_finished_at)}`}
              </span>
            </span>
          </span>
        </span>

        <span className="text-right sm:text-left">
          <Percent value={student.best_percent} />
        </span>
        <span className="hidden sm:block">
          <Percent value={student.last_percent} />
        </span>
        <span className="hidden text-sm text-base-content/60 sm:block">
          {formatDateTime(student.last_finished_at)}
        </span>
        <ChevronRight className="hidden size-4 text-base-content/30 sm:block" />
      </button>
    </li>
  );
}

function AdminResultsPage() {
  const [testId, setTestId] = useState("");
  const [query, setQuery] = useState("");
  const [openStudentId, setOpenStudentId] = useState(null);
  const { data: tests } = useAdminTests();
  const { data, isPending, error, refetch } = useAdminResults(testId || null);

  const needle = query.trim().toLowerCase();
  const ranked = (data?.students ?? []).map((student, index) => ({ student, rank: index + 1 }));
  const visible = needle
    ? ranked.filter(({ student }) => student.nickname.toLowerCase().includes(needle))
    : ranked;
  const leader = data?.students.find((student) => student.best_percent != null);

  return (
    <>
      <PageHeader title="Natijalar" description="O'quvchilarning natijalari va urinishlar tarixi">
        <select
          className="select w-full sm:w-64"
          value={testId}
          onChange={(event) => setTestId(event.target.value)}
          aria-label="Test bo'yicha filtr"
        >
          <option value="">Barcha testlar</option>
          {tests?.map((test) => (
            <option key={test.id} value={test.id}>
              {test.title}
            </option>
          ))}
        </select>
      </PageHeader>

      {isPending && <Loading />}
      {error && <ErrorState error={error} onRetry={refetch} />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatCard
              icon={Users}
              label="Faol o'quvchilar"
              value={data.summary.active_student_count}
              hint={`jami ${data.summary.student_count} ta`}
            />
            <StatCard icon={Repeat} label="Urinishlar" value={data.summary.attempt_count} tone="secondary" />
            <StatCard
              icon={ChartColumn}
              label="O'rtacha natija"
              value={data.summary.average_best_percent == null ? "—" : `${data.summary.average_best_percent}%`}
              hint="eng yaxshi natijalar bo'yicha"
              tone="success"
            />
            <StatCard
              icon={Trophy}
              label="Yetakchi"
              value={leader ? `${leader.best_percent}%` : "—"}
              hint={leader?.nickname}
              tone="accent"
            />
          </div>

          {data.students.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                icon={Users}
                title="Hali o'quvchilar yo'q"
                description="O'quvchilar ro'yxatdan o'tgach, ularning natijalari shu yerda ko'rinadi."
              />
            </div>
          ) : (
            <div className="surface mt-6 overflow-hidden rounded-box">
              <div className="border-b border-white/5 p-3">
                <label className="input w-full">
                  <Search className="size-4 opacity-50" />
                  <input
                    type="search"
                    className="grow"
                    placeholder="Nickname bo'yicha qidirish..."
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                  />
                </label>
              </div>

              <div className="hidden grid-cols-[2.5rem_1fr_7rem_7rem_9rem_1.5rem] gap-3 border-b border-white/5 px-4 py-2.5 text-xs font-medium tracking-wide text-base-content/50 uppercase sm:grid">
                <span className="text-center">#</span>
                <span>O'quvchi</span>
                <span>Eng yaxshi</span>
                <span>Oxirgi</span>
                <span>Sana</span>
                <span />
              </div>

              {visible.length === 0 ? (
                <p className="py-10 text-center text-base-content/60">Hech narsa topilmadi</p>
              ) : (
                <ul className="divide-y divide-white/5">
                  {visible.map(({ student, rank }) => (
                    <StudentRow key={student.id} student={student} rank={rank} onOpen={setOpenStudentId} />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}

      <StudentHistoryModal studentId={openStudentId} onClose={() => setOpenStudentId(null)} />
    </>
  );
}

export default AdminResultsPage;
