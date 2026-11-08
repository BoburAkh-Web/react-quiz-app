import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CircleAlert, User } from "lucide-react";
import { useStudentAuth } from "../context/StudentAuthContext";
import AuthHero from "../components/auth/AuthHero";
import PasswordStrength from "../components/auth/PasswordStrength";
import Field from "../components/ui/Field";
import Logo from "../components/ui/Logo";
import PasswordInput from "../components/ui/PasswordInput";

const MODES = {
  login: {
    tab: "Kirish",
    title: "Xush kelibsiz! 👋",
    subtitle: "Testlarni davom ettirish uchun hisobingizga kiring",
    submit: "Kirish",
  },
  register: {
    tab: "Ro'yxatdan o'tish",
    title: "Hisob yarating ✨",
    subtitle: "Bir daqiqada ro'yxatdan o'ting va birinchi testni boshlang",
    submit: "Ro'yxatdan o'tish",
  },
};

function LoginPage() {
  const { student, login, register } = useStudentAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState("login");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === "login";
  const copy = MODES[mode];

  if (student) return <Navigate to="/tests" replace />;

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!nickname.trim() || !password) {
      setError("Nickname va parolni kiriting");
      return;
    }

    setIsSubmitting(true);
    setError("");
    try {
      await (isLogin ? login : register)(nickname, password);
      navigate(location.state?.from ?? "/tests", { replace: true });
    } catch (submitError) {
      setError(submitError.message);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <AuthHero />

      <section className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Logo size="lg" />
          </div>

          <div className="surface rounded-box p-6 sm:p-8">
            <h2 className="text-2xl font-bold">{copy.title}</h2>
            <p className="mt-1 text-base-content/60">{copy.subtitle}</p>

            <div role="tablist" className="tabs-box mt-6 tabs grid grid-cols-2">
              {Object.entries(MODES).map(([key, { tab }]) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={mode === key}
                  className={`tab ${mode === key ? "tab-active" : ""}`}
                  onClick={() => switchMode(key)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit} noValidate>
              <Field label="Nickname" htmlFor="nickname">
                <label className="input input-lg w-full">
                  <User className="size-5 opacity-50" />
                  <input
                    id="nickname"
                    className="grow"
                    value={nickname}
                    onChange={(event) => setNickname(event.target.value)}
                    placeholder="Masalan: bobur_dev"
                    autoComplete="username"
                    spellCheck="false"
                    maxLength={30}
                  />
                </label>
              </Field>

              <Field label="Parol" htmlFor="password">
                <PasswordInput
                  id="password"
                  large
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={isLogin ? "Parolingizni kiriting" : "Yangi parol o'ylab toping"}
                  autoComplete={isLogin ? "current-password" : "new-password"}
                />
              </Field>

              {!isLogin && <PasswordStrength password={password} />}

              {error && (
                <div role="alert" className="alert alert-error alert-soft">
                  <CircleAlert className="size-5" />
                  <span>{error}</span>
                </div>
              )}

              <button type="submit" className="btn btn-block btn-lg btn-primary" disabled={isSubmitting}>
                {isSubmitting ? (
                  <span className="loading loading-spinner" />
                ) : (
                  <>
                    {copy.submit}
                    <ArrowRight className="size-5" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}

export default LoginPage;
