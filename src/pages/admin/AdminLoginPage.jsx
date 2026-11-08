import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CircleAlert, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";
import Field from "../../components/ui/Field";
import PasswordInput from "../../components/ui/PasswordInput";

function AdminLoginPage() {
  const { isAdmin, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  if (isAdmin) return <Navigate to="/admin" replace />;

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await login(password);
      navigate(location.state?.from ?? "/admin", { replace: true });
    } catch (loginError) {
      setError(loginError.message);
      setShakeKey((key) => key + 1);
      setIsSubmitting(false);
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="surface rounded-box p-6 text-center sm:p-8">
          <span className="mx-auto grid size-16 -rotate-6 place-items-center rounded-2xl bg-linear-to-br from-accent to-orange-600 text-accent-content shadow-lg shadow-accent/20">
            <ShieldCheck className="size-8 rotate-6" />
          </span>
          <span className="mt-5 badge gap-2 badge-soft badge-accent">
            <span className="status status-warning animate-pulse" />
            Himoyalangan hudud
          </span>
          <h1 className="mt-3 text-2xl font-bold">Admin panel</h1>
          <p className="mt-1 text-sm text-base-content/60">
            Testlar va natijalarni boshqarish uchun admin parolini kiriting
          </p>

          <form
            key={shakeKey}
            className={`mt-6 space-y-4 text-left ${shakeKey ? "animate-shake" : ""}`}
            onSubmit={handleSubmit}
          >
            <Field label="Admin paroli" htmlFor="admin-password">
              <PasswordInput
                id="admin-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="••••••••"
                autoComplete="current-password"
                autoFocus
              />
            </Field>

            {error && (
              <div role="alert" className="alert alert-error alert-soft text-sm">
                <CircleAlert className="size-5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-block btn-accent"
              disabled={!password || isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading loading-spinner" />
              ) : (
                <>
                  Kirish
                  <ArrowRight className="size-5" />
                </>
              )}
            </button>
          </form>
        </div>

        <Link to="/" className="btn mt-4 w-full gap-2 btn-ghost btn-sm">
          <ArrowLeft className="size-4" />
          O'quvchilar sahifasiga qaytish
        </Link>
      </div>
    </div>
  );
}

export default AdminLoginPage;
