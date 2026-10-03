import { useEffect, useState } from "react";
import { supabase } from "./supabase";

const MEDALS = ["🥇", "🥈", "🥉"];

function fetchStudents() {
  return supabase
    .from("students")
    .select(
      "nickname, last_points, last_correct, last_wrong, best_points, updated_at",
    )
    .order("best_points", { ascending: false });
}

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Test ishlagan o'quvchida kamida bitta javob bo'ladi
function hasAttempted(student) {
  return student.last_correct + student.last_wrong > 0;
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <strong className="stat-value">{value}</strong>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

function Dashboard() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError("");

      const { data, error } = await fetchStudents();

      if (error) {
        setError("O'quvchilarni yuklashda xatolik: " + error.message);
      } else {
        setStudents(data);
      }
      setIsLoading(false);
    }
    load();
  }, [reloadKey]);

  if (isLoading) return <p className="dashboard-message">Yuklanmoqda...</p>;
  if (error) return <p className="dashboard-message error">{error}</p>;
  if (students.length === 0)
    return <p className="dashboard-message">Hali o'quvchilar yo'q</p>;

  const attempted = students.filter(hasAttempted);
  const avgBest = attempted.length
    ? Math.round(
        attempted.reduce((sum, s) => sum + s.best_points, 0) / attempted.length,
      )
    : 0;
  const leader = students[0];

  // O'rin butun ro'yxat bo'yicha hisoblanadi, qidiruvdan oldin
  const ranked = students.map((student, i) => ({ ...student, rank: i + 1 }));
  const visible = ranked.filter((s) =>
    s.nickname.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <div className="dashboard">
      <div className="stat-cards">
        <StatCard
          label="O'quvchilar"
          value={students.length}
          sub={`${attempted.length} tasi test ishlagan`}
        />
        <StatCard
          label="O'rtacha eng yaxshi ball"
          value={avgBest}
          sub="test ishlaganlar bo'yicha"
        />
        <StatCard
          label="Eng yuqori ball"
          value={leader.best_points}
          sub={leader.best_points > 0 ? leader.nickname : "—"}
        />
      </div>

      <div className="dashboard-toolbar">
        <input
          className="dashboard-search"
          type="text"
          placeholder="🔍 Nickname bo'yicha qidirish..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button
          className="btn dashboard-refresh"
          onClick={() => setReloadKey((k) => k + 1)}
        >
          ↻ Yangilash
        </button>
      </div>

      <table className="dashboard-table">
        <thead>
          <tr>
            <th className="col-rank">#</th>
            <th>O'quvchi</th>
            <th className="col-last">Oxirgi natija</th>
            <th className="col-best">Eng yaxshi</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((student) => {
            const total = student.last_correct + student.last_wrong;
            const accuracy = total
              ? Math.round((student.last_correct / total) * 100)
              : 0;

            return (
              <tr key={student.nickname}>
                <td className="col-rank">
                  {student.rank <= 3 && student.best_points > 0
                    ? MEDALS[student.rank - 1]
                    : student.rank}
                </td>

                <td>
                  <div className="student-cell">
                    <span className="student-avatar">
                      {student.nickname.charAt(0).toUpperCase()}
                    </span>
                    <div className="student-info">
                      <span className="student-name">{student.nickname}</span>
                      <span className="student-date">
                        {hasAttempted(student)
                          ? formatDate(student.updated_at)
                          : "Hali test ishlamagan"}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="col-last">
                  {hasAttempted(student) ? (
                    <div className="last-result">
                      <div className="last-result-top">
                        <strong>{student.last_points} ball</strong>
                        <span>
                          <span className="count-correct">
                            ✓ {student.last_correct}
                          </span>{" "}
                          <span className="count-wrong">
                            ✗ {student.last_wrong}
                          </span>
                        </span>
                      </div>
                      <div
                        className="accuracy-bar"
                        title={`${accuracy}% to'g'ri`}
                      >
                        <div
                          className="accuracy-fill"
                          style={{ width: `${accuracy}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>

                <td className="col-best">
                  <span className="best-badge">{student.best_points}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {visible.length === 0 && (
        <p className="dashboard-message">Hech narsa topilmadi</p>
      )}
    </div>
  );
}

export default Dashboard;
