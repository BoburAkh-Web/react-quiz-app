import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { RequireAdmin, RequireStudent } from "./components/layout/RouteGuards";
import StudentLayout from "./components/layout/StudentLayout";
import Loading from "./components/ui/Loading";
import LoginPage from "./pages/LoginPage";
import TestsPage from "./pages/TestsPage";
import QuizPage from "./pages/QuizPage";
import NotFoundPage from "./pages/NotFoundPage";

// Admin qismi alohida yuklanadi: o'quvchilar telefonida keraksiz kod yuklanmaydi
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminTestsPage = lazy(() => import("./pages/admin/AdminTestsPage"));
const AdminTestPage = lazy(() => import("./pages/admin/AdminTestPage"));
const AdminResultsPage = lazy(() => import("./pages/admin/AdminResultsPage"));

function App() {
  return (
    <Suspense fallback={<Loading fullPage />}>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        <Route element={<RequireStudent />}>
          <Route element={<StudentLayout />}>
            <Route path="/tests" element={<TestsPage />} />
            <Route path="/tests/:testId" element={<QuizPage />} />
          </Route>
        </Route>

        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="tests" replace />} />
            <Route path="tests" element={<AdminTestsPage />} />
            <Route path="tests/:testId" element={<AdminTestPage />} />
            <Route path="results" element={<AdminResultsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
