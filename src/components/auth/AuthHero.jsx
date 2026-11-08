import { Check, Lightbulb, Star, Trophy, Zap } from "lucide-react";
import Logo from "../ui/Logo";

const FEATURES = [
  { icon: Zap, text: "Tezkor testlar va darhol natija" },
  { icon: Trophy, text: "Ball to'plang, eng yaxshi natijangizni yangilang" },
  { icon: Lightbulb, text: "Har bir javobga qisqa tushuntirish" },
];

const PREVIEW_OPTIONS = [
  { text: "pop()", isCorrect: false },
  { text: "push()", isCorrect: true },
  { text: "shift()", isCorrect: false },
];

// Kirish sahifasining chap paneli (faqat katta ekranda)
function AuthHero() {
  return (
    <section className="relative hidden flex-col justify-between overflow-hidden border-r border-white/5 bg-base-200/40 p-12 lg:flex">
      <Logo size="lg" />

      <div className="max-w-lg">
        <h1 className="text-5xl leading-tight font-extrabold tracking-tight">
          JavaScript'ni <span className="text-gradient">o'ynab</span> o'rganing
        </h1>
        <p className="mt-4 text-lg text-base-content/70">
          Testlar ishlang, ball to'plang va bilimingiz qanday o'sayotganini kuzating.
        </p>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-base-content/80">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
                <Icon className="size-5" />
              </span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div aria-hidden="true" className="surface w-full max-w-sm -rotate-2 rounded-box p-5">
        <div className="flex items-center justify-between text-xs text-base-content/60">
          <span>Savol 3 / 10</span>
          <span className="badge gap-1 badge-soft badge-sm badge-accent">
            <Star className="size-3 fill-current" /> 40 ball
          </span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full w-1/3 rounded-full bg-brand" />
        </div>
        <p className="mt-4 font-semibold">Massiv oxiriga element qo'shadigan metod qaysi?</p>
        <div className="mt-3 space-y-2">
          {PREVIEW_OPTIONS.map(({ text, isCorrect }) => (
            <div
              key={text}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 font-mono text-sm ${
                isCorrect ? "border-success bg-success/10" : "border-white/5 bg-base-200/70 opacity-60"
              }`}
            >
              {text}
              {isCorrect && <Check className="ml-auto size-4 text-success" />}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default AuthHero;
