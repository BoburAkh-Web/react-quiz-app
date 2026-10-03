// Login sahifalari uchun animatsiyali fon (suzuvchi gradient "blob"lar + to'r)
function AuthBackground() {
  return (
    <div className="auth-bg" aria-hidden="true">
      <span className="auth-blob auth-blob--1" />
      <span className="auth-blob auth-blob--2" />
      <span className="auth-blob auth-blob--3" />
    </div>
  );
}

export default AuthBackground;
