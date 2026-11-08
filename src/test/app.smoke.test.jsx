import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import App from "../App";
import AppProviders from "../AppProviders";
import { queryClient } from "../lib/queryClient";

const api = vi.hoisted(() => ({
  studentApi: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(async () => {}),
    getSession: vi.fn(),
    listTests: vi.fn(),
    startAttempt: vi.fn(),
    submitAnswer: vi.fn(),
    finishAttempt: vi.fn(),
  },
  adminApi: {
    login: vi.fn(),
    verify: vi.fn(),
    logout: vi.fn(async () => {}),
    listTests: vi.fn(),
    saveTest: vi.fn(),
    deleteTest: vi.fn(),
    listQuestions: vi.fn(),
    saveQuestion: vi.fn(),
    addQuestions: vi.fn(),
    deleteQuestion: vi.fn(),
    questionStats: vi.fn(),
    results: vi.fn(),
    studentAttempts: vi.fn(),
    resetStudentPassword: vi.fn(),
    deleteStudent: vi.fn(),
    generateQuestions: vi.fn(),
  },
}));

vi.mock("../lib/api", () => ({ ...api, ApiError: class ApiError extends Error {} }));
vi.mock("canvas-confetti", () => ({ default: () => {} }));

const TEST = {
  id: "t1",
  title: "Massivlar",
  description: "push, pop va boshqalar",
  seconds_per_question: 30,
  created_at: "2026-11-01T10:00:00Z",
  question_count: 2,
  total_points: 30,
  best_score: null,
  attempt_count: 0,
  has_open_attempt: false,
};

const QUESTIONS = [
  { id: "q1", question: "Oxiriga qo'shadigan metod?", options: ["pop()", "push()", "shift()", "map()"], points: 10 },
  { id: "q2", question: "Boshidan o'chiradigan metod?", options: ["shift()", "pop()"], points: 20 },
];

function renderApp(route) {
  return render(
    <AppProviders>
      <MemoryRouter initialEntries={[route]}>
        <App />
      </MemoryRouter>
    </AppProviders>,
  );
}

beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  queryClient.clear();
});

describe("o'quvchi", () => {
  it("login qiladi va testlar ro'yxatini ko'radi", async () => {
    api.studentApi.login.mockResolvedValue({ token: "s-token", student: { id: "s1", nickname: "ali" } });
    api.studentApi.listTests.mockResolvedValue([TEST]);

    renderApp("/");
    fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "ali" } });
    fireEvent.change(screen.getByLabelText("Parol"), { target: { value: "secret123" } });
    fireEvent.click(screen.getByRole("button", { name: /^Kirish$/ }));

    expect(await screen.findByText("Salom, ali! 👋")).toBeInTheDocument();
    expect(api.studentApi.login).toHaveBeenCalledWith("ali", "secret123");
    expect(sessionStorage.getItem("hq.studentToken")).toBe("s-token");
    expect(await screen.findByText("Massivlar")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Boshlash/ })).toHaveAttribute("href", "/tests/t1");
  });

  it("ro'yxatdan o'tishda parol qoidalarini ko'rsatadi va xatoni chiqaradi", async () => {
    api.studentApi.register.mockRejectedValue(new Error("Bu nickname band, boshqasini tanlang"));

    renderApp("/");
    fireEvent.click(screen.getByRole("tab", { name: "Ro'yxatdan o'tish" }));
    expect(screen.getByText("Kamida 8 ta belgi")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Nickname"), { target: { value: "ali" } });
    fireEvent.change(screen.getByLabelText("Parol"), { target: { value: "parol1234" } });
    fireEvent.click(screen.getByRole("button", { name: /^Ro'yxatdan o'tish$/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Bu nickname band");
  });

  it("testni boshidan oxirigacha ishlaydi: javob, tushuntirish, natija va tahlil", async () => {
    sessionStorage.setItem("hq.studentToken", "s-token");
    api.studentApi.getSession.mockResolvedValue({ id: "s1", nickname: "ali" });
    api.studentApi.listTests.mockResolvedValue([TEST]);
    const now = Date.now();
    api.studentApi.startAttempt.mockResolvedValue({
      attempt_id: "a1",
      test: { id: "t1", title: "Massivlar" },
      started_at: new Date(now).toISOString(),
      ends_at: new Date(now + 60_000).toISOString(),
      server_now: new Date(now).toISOString(),
      max_score: 30,
      questions: QUESTIONS,
      answers: [],
    });
    api.studentApi.submitAnswer
      .mockResolvedValueOnce({ is_correct: true, correct_option: 1, points_awarded: 10, explanation: "push() oxiriga qo'shadi" })
      .mockResolvedValueOnce({ is_correct: false, correct_option: 0, points_awarded: 0, explanation: "" });
    api.studentApi.finishAttempt.mockResolvedValue({
      score: 10,
      max_score: 30,
      correct_count: 1,
      wrong_count: 1,
      question_count: 2,
      best_score: 10,
      review: [
        { question_id: "q1", question: QUESTIONS[0].question, options: QUESTIONS[0].options, correct_option: 1, selected_option: 1, is_correct: true, points: 10, explanation: "push() oxiriga qo'shadi" },
        { question_id: "q2", question: QUESTIONS[1].question, options: QUESTIONS[1].options, correct_option: 0, selected_option: 1, is_correct: false, points: 20, explanation: "" },
      ],
    });

    renderApp("/tests/t1");
    fireEvent.click(await screen.findByRole("button", { name: /Testni boshlash/ }));

    expect(await screen.findByText("Oxiriga qo'shadigan metod?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /push\(\)/ }));
    // Variant asl indeksi bilan yuboriladi (ekranda aralashtirilgan bo'lsa ham)
    await waitFor(() => expect(api.studentApi.submitAnswer).toHaveBeenCalledWith("a1", "q1", 1));
    expect(await screen.findByText("push() oxiriga qo'shadi")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Keyingi savol/ }));
    expect(await screen.findByText("Boshidan o'chiradigan metod?")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /pop\(\)/ }));
    await waitFor(() => expect(api.studentApi.submitAnswer).toHaveBeenCalledWith("a1", "q2", 1));

    fireEvent.click(await screen.findByRole("button", { name: /Yakunlash/ }));
    expect(await screen.findByText("Javoblar tahlili")).toBeInTheDocument();
    expect(screen.getByText(/to'pladingiz/).textContent).toMatch(/10\s*\/\s*30/);
    fireEvent.click(screen.getByRole("tab", { name: "Xatolar (1)" }));
    expect(screen.getByText(/Boshidan o'chiradigan metod\?/)).toBeInTheDocument();
    expect(screen.queryByText(/Oxiriga qo'shadigan metod\?/)).not.toBeInTheDocument();
  });

  it("tokensiz himoyalangan sahifadan login sahifasiga qaytaradi", async () => {
    renderApp("/tests");
    expect(await screen.findByRole("tab", { name: "Kirish" })).toBeInTheDocument();
  });
});

describe("admin", () => {
  const ADMIN_TEST = { ...TEST, is_published: true, attempt_count: 3 };
  const ADMIN_QUESTIONS = [
    { id: "q1", test_id: "t1", question: "Oxiriga qo'shadigan metod?", options: ["pop()", "push()"], correct_option: 1, points: 10, explanation: "push() oxiriga qo'shadi" },
  ];

  beforeEach(() => {
    sessionStorage.setItem("hq.adminToken", "a-token");
    api.adminApi.verify.mockResolvedValue(true);
    api.adminApi.listTests.mockResolvedValue([ADMIN_TEST]);
  });

  it("testlar, savollar, statistika va AI tablari ochiladi", async () => {
    api.adminApi.listQuestions.mockResolvedValue(ADMIN_QUESTIONS);
    api.adminApi.questionStats.mockResolvedValue([
      { id: "q1", question: "Oxiriga qo'shadigan metod?", answer_count: 4, correct_count: 1, correct_percent: 25 },
    ]);

    renderApp("/admin/tests");
    expect(await screen.findByText("Massivlar")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Savollarni boshqarish" }));

    expect(await screen.findByText("Oxiriga qo'shadigan metod?")).toBeInTheDocument();
    expect(screen.getByText("push() oxiriga qo'shadi")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /Statistika/ }));
    expect(await screen.findByText("25%")).toBeInTheDocument();
    expect(screen.getByText("4 ta javobdan 1 tasi to'g'ri")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /AI generator/ }));
    expect(await screen.findByLabelText("Mavzu")).toHaveValue("Massivlar");
  });

  it("savol qo'shish formasi tekshiradi va saqlaydi", async () => {
    api.adminApi.listQuestions.mockResolvedValue([]);
    api.adminApi.saveQuestion.mockResolvedValue({ id: "new" });

    renderApp("/admin/tests/t1");
    fireEvent.click(await screen.findByRole("button", { name: /Savol qo'shish/ }));
    const dialog = await screen.findByRole("dialog");

    fireEvent.click(within(dialog).getByRole("button", { name: /^Qo'shish$/ }));
    expect(within(dialog).getByText("Savol matnini kiriting")).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText("Savol matni"), { target: { value: "2 + 2 = ?" } });
    ["3", "4"].forEach((value, i) =>
      fireEvent.change(within(dialog).getByLabelText(`${"AB"[i]} variant`), { target: { value } }),
    );
    // Bo'sh C va D variantlarni o'chiramiz, B ni to'g'ri deb belgilaymiz
    fireEvent.click(within(dialog).getByLabelText("D variantni o'chirish"));
    fireEvent.click(within(dialog).getByLabelText("C variantni o'chirish"));
    fireEvent.click(within(dialog).getByLabelText("B variantni to'g'ri deb belgilash"));
    fireEvent.click(within(dialog).getByRole("button", { name: /^Qo'shish$/ }));

    // TanStack Query mutationFn'ga ikkinchi argument (context) ham uzatadi, shuning uchun faqat birinchisini tekshiramiz
    await waitFor(() => expect(api.adminApi.saveQuestion).toHaveBeenCalled());
    expect(api.adminApi.saveQuestion.mock.calls[0][0]).toMatchObject({
      test_id: "t1",
      question: "2 + 2 = ?",
      options: ["3", "4"],
      correct_option: 1,
      points: 10,
    });
  });

  it("natijalar va o'quvchi tarixi", async () => {
    api.adminApi.results.mockResolvedValue({
      summary: { student_count: 2, active_student_count: 1, attempt_count: 3, average_best_percent: 80 },
      students: [
        { id: "s1", nickname: "ali", attempt_count: 3, best_score: 24, best_percent: 80, last_percent: 60, last_finished_at: "2026-11-02T09:30:00Z" },
        { id: "s2", nickname: "vali", attempt_count: 0, best_score: null, best_percent: null, last_percent: null, last_finished_at: null },
      ],
    });
    api.adminApi.studentAttempts.mockResolvedValue({
      student: { id: "s1", nickname: "ali", created_at: "2026-10-01T08:00:00Z" },
      attempts: [
        { id: "a1", test_title: "Massivlar", score: 24, max_score: 30, correct_count: 2, wrong_count: 1, finished_at: "2026-11-02T09:30:00Z", is_legacy: false },
        { id: "a2", test_title: null, score: 10, max_score: null, correct_count: null, wrong_count: null, finished_at: "2026-10-02T09:30:00Z", is_legacy: true },
      ],
    });

    renderApp("/admin/results");
    // "vali" qatori ham /ali/ ga mos keladi; ro'yxat reyting bo'yicha, ali birinchi
    const [aliRow] = await screen.findAllByRole("button", { name: /ali/ });
    expect(screen.getByText("Hali test ishlamagan")).toBeInTheDocument();

    fireEvent.click(aliRow);
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByText("Urinishlar (2)")).toBeInTheDocument();
    expect(within(dialog).getByText("O'chirilgan test")).toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Saqlash" })).toBeDisabled();
  });

  it("admin tokenisiz admin login sahifasiga qaytaradi", async () => {
    sessionStorage.clear();
    renderApp("/admin/tests");
    expect(await screen.findByText("Admin panel")).toBeInTheDocument();
  });
});
