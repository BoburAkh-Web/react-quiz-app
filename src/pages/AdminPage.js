import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Main from "../components/Main";
import AddQuestions from "../components/AddQuestions";
import Dashboard from "../components/Dashboard";
import { supabase } from "../components/supabase";

function AdminPage() {
  const [activeTab, setActiveTab] = useState("questions"); // "questions" | "dashboard"
  const [numQuestions, setNumQuestions] = useState(null);

  const navigate = useNavigate();

  // Savol qo'shilgach/o'chirilgach bazadagi savollar sonini yangilash
  async function fetchQuestionsCount() {
    const { count, error } = await supabase
      .from("questions")
      .select("*", { count: "exact", head: true });
    if (!error) setNumQuestions(count);
  }
  useEffect(() => {
    fetchQuestionsCount();
  }, []);

  function handleLogout() {
    sessionStorage.removeItem("isAdmin");
    navigate("/admin-login");
  }

  return (
    <div className="app">
      <Header />

      <Main>
        <div className="admin-page">
          <div className="admin-toolbar">
            <div className="admin-tabs">
              <button
                className={`btn admin-tab ${activeTab === "questions" ? "active" : ""}`}
                onClick={() => setActiveTab("questions")}
              >
                Savol qo'shish
              </button>
              <button
                className={`btn admin-tab ${activeTab === "dashboard" ? "active" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                Dashboard
              </button>
            </div>

            <button className="btn admin-logout" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {activeTab === "questions" && (
            <>
              {numQuestions !== null && (
                <p className="admin-info">📚 Bazada {numQuestions} ta savol bor</p>
              )}
              <AddQuestions onQuestionAdded={fetchQuestionsCount} />
            </>
          )}
          {activeTab === "dashboard" && <Dashboard />}
        </div>
      </Main>
    </div>
  );
}

export default AdminPage;
