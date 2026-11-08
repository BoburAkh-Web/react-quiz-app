import { Link } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock, ListChecks, Play, Star, StepForward, Trophy } from "lucide-react";
import { formatMinutes, percent } from "../../lib/utils";

const RULES = [
  "Har bir savolga bitta javob beriladi — tanlagandan keyin o'zgartirib bo'lmaydi",
  "Vaqt tugasa, test avtomatik yakunlanadi",
  "Sahifa yopilib qolsa, testni shu joydan davom ettirasiz",
  "Oxirida natija va har bir javob tahlili ko'rsatiladi",
];

function IntroStat({ icon: Icon, value, label }) {
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-4 text-center">
      <Icon className="size-5 text-primary" />
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs text-base-content/50">{label}</span>
    </div>
  );
}

function QuizIntro({ test, isStarting, onStart }) {
  const totalSeconds = test.question_count * test.seconds_per_question;
  const bestPercent = test.best_score == null ? null : percent(test.best_score, test.total_points);

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/tests" className="btn mb-4 gap-2 btn-ghost btn-sm">
        <ArrowLeft className="size-4" />
        Testlar
      </Link>

      <div className="surface overflow-hidden rounded-box">
        <div className="flex items-start gap-4 p-6 sm:p-8">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-brand text-white">
            <BookOpen className="size-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-balance">{test.title}</h1>
            {test.description && <p className="mt-1 text-base-content/60">{test.description}</p>}
          </div>
        </div>

        <div className="grid grid-cols-3 divide-x divide-white/5 border-y border-white/5">
          <IntroStat icon={ListChecks} value={test.question_count} label="savol" />
          <IntroStat icon={Clock} value={formatMinutes(totalSeconds)} label="vaqt" />
          <IntroStat icon={Star} value={test.total_points} label="ball" />
        </div>

        <div className="space-y-5 p-6 sm:p-8">
          <div>
            <h2 className="font-semibold">Qoidalar</h2>
            <ul className="mt-3 space-y-2 text-sm text-base-content/70">
              {RULES.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {bestPercent != null && (
            <div className="alert alert-soft">
              <Trophy className="size-5 text-accent" />
              <span>
                Eng yaxshi natijangiz: <strong>{bestPercent}%</strong> ({test.attempt_count} marta
                ishlagansiz)
              </span>
            </div>
          )}

          <button
            type="button"
            className={`btn btn-block btn-lg ${test.has_open_attempt ? "btn-warning" : "btn-primary"}`}
            onClick={onStart}
            disabled={isStarting}
          >
            {isStarting ? (
              <span className="loading loading-spinner" />
            ) : test.has_open_attempt ? (
              <>
                <StepForward className="size-5" /> Davom ettirish
              </>
            ) : (
              <>
                <Play className="size-5" /> Testni boshlash
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuizIntro;
