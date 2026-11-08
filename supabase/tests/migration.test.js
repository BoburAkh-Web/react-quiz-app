// @vitest-environment node
//
// Migratsiyani haqiqiy Postgres'da (PGlite) Supabase muhitiga o'xshatib tekshiradi:
// anon roli, extensions sxemasi va eski platformadagi jadvallar bilan.
import { readdirSync, readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { beforeAll, describe, expect, it } from "vitest";

// Barcha migratsiyalar Supabase'dagi kabi tartib bilan
const MIGRATIONS_DIR = new URL("../migrations/", import.meta.url);
const MIGRATION = readdirSync(MIGRATIONS_DIR)
  .filter((file) => file.endsWith(".sql"))
  .sort()
  .map((file) => readFileSync(new URL(file, MIGRATIONS_DIR), "utf8"))
  .join("\n");

async function createLegacyDatabase({ optionsType = "jsonb" } = {}) {
  const db = await PGlite.create({ extensions: { pgcrypto } });
  const optionsValue = (options) =>
    optionsType === "jsonb" ? JSON.stringify(options) : options;

  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema extensions;
    grant usage on schema public to anon, authenticated;

    create table public.students (
      id bigint generated always as identity primary key,
      nickname text unique not null,
      password text,
      last_points int default 0,
      last_correct int default 0,
      last_wrong int default 0,
      best_points int default 0,
      updated_at timestamptz
    );
    create table public.questions (
      id bigint generated always as identity primary key,
      question text,
      options ${optionsType === "jsonb" ? "jsonb" : "text[]"},
      "correctOption" int,
      points int
    );
    grant all on all tables in schema public to anon, authenticated;

    insert into public.students (nickname, password, last_points, last_correct, last_wrong, best_points, updated_at)
    values ('ali', 'secret123', 10, 1, 1, 30, now()),
           ('vali', 'parol1234', 0, 0, 0, 0, null),
           ('bosh', null, 0, 0, 0, 0, null);
  `);

  const legacyQuestions = [
    ["2 + 2 = ?", ["3", "4", "5", "6"], 1, 10],
    ["const nima?", ["o'zgarmas", "funksiya", "massiv", "obyekt"], 0, 20],
  ];
  for (const [question, options, correct, points] of legacyQuestions) {
    await db.query(
      `insert into public.questions (question, options, "correctOption", points) values ($1, $2, $3, $4)`,
      [question, optionsValue(options), correct, points],
    );
  }
  return db;
}

// Brauzer kabi: anon roli bilan faqat public RPC chaqiradi
function rpcClient(db) {
  return async function rpc(fn, ...args) {
    const placeholders = args.map((_, i) => `$${i + 1}`).join(", ");
    await db.exec("set role anon");
    try {
      const result = await db.query(`select public.${fn}(${placeholders}) as r`, args);
      return result.rows[0].r;
    } finally {
      await db.exec("reset role");
    }
  };
}

async function expectError(promise, message) {
  await expect(promise).rejects.toThrow(message);
}

describe("migratsiya: eski ma'lumotlar va xavfsizlik", () => {
  let db;
  let rpc;

  beforeAll(async () => {
    db = await createLegacyDatabase();
    await db.exec(MIGRATION);
    rpc = rpcClient(db);
  });

  it("eski jadvallar yopiq sxemaga o'tadi, anon jadvallarni o'qiy olmaydi", async () => {
    const tables = await db.query(
      `select table_schema, table_name from information_schema.tables
       where table_name in ('students', 'questions') order by 1, 2`,
    );
    expect(tables.rows.map((r) => `${r.table_schema}.${r.table_name}`)).toEqual([
      "quiz.questions",
      "quiz.students",
      "quiz_legacy.questions",
      "quiz_legacy.students",
    ]);

    await db.exec("set role anon");
    try {
      await expectError(db.query("select * from quiz.students"), "permission denied");
      await expectError(db.query("select * from quiz_legacy.students"), "permission denied");
      await expectError(db.query("select quiz.set_admin_password('x')"), "permission denied");
    } finally {
      await db.exec("reset role");
    }
  });

  it("eski o'quvchi eski paroli bilan kiradi, parol bcrypt'da saqlanadi", async () => {
    const session = await rpc("login_student", "ali", "secret123");
    expect(session.student.nickname).toBe("ali");
    expect(session.token).toMatch(/^[0-9a-f]{64}$/);

    const stored = await db.query("select password_hash from quiz.students where nickname = 'ali'");
    expect(stored.rows[0].password_hash).toMatch(/^\$2a\$/);

    await expectError(rpc("login_student", "ali", "noto'g'ri1"), "invalid_credentials");
    await expectError(rpc("login_student", "bosh", ""), "invalid_credentials");
  });

  it("eski savollar va natijalar 'Umumiy test'ga o'tadi", async () => {
    const { token } = await rpc("login_student", "ali", "secret123");
    const tests = await rpc("list_tests", token);
    expect(tests).toHaveLength(1);
    expect(tests[0]).toMatchObject({
      title: "Umumiy test",
      question_count: 2,
      total_points: 30,
      best_score: 30,
      attempt_count: 2,
    });
  });

  it("ro'yxatdan o'tish qoidalari serverda tekshiriladi", async () => {
    await expectError(rpc("register_student", "a", "parol1234"), "invalid_nickname");
    await expectError(rpc("register_student", "yangi", "qisqa1"), "weak_password");
    await expectError(rpc("register_student", "yangi", "faqatharf"), "weak_password");
    await expectError(rpc("register_student", "ali", "parol1234"), "nickname_taken");

    const created = await rpc("register_student", "  yangi  ", "parol1234");
    expect(created.student.nickname).toBe("yangi");
    expect(await rpc("get_student_session", created.token)).toMatchObject({ nickname: "yangi" });

    await rpc("logout", created.token);
    await expectError(rpc("get_student_session", created.token), "session_expired");
  });

  it("test jarayoni: javob yashirin, serverda tekshiriladi, davom ettirsa bo'ladi", async () => {
    const { token } = await rpc("login_student", "vali", "parol1234");
    const [test] = await rpc("list_tests", token);

    const attempt = await rpc("start_attempt", token, test.id);
    expect(attempt.questions).toHaveLength(2);
    expect(attempt.answers).toEqual([]);
    for (const q of attempt.questions) {
      expect(Object.keys(q).sort()).toEqual(["id", "options", "points", "question"]);
    }

    const byText = Object.fromEntries(attempt.questions.map((q) => [q.question, q]));
    const easy = byText["2 + 2 = ?"];
    const right = await rpc("submit_answer", token, attempt.attempt_id, easy.id, 1);
    expect(right).toMatchObject({ is_correct: true, correct_option: 1, points_awarded: 10 });
    await expectError(rpc("submit_answer", token, attempt.attempt_id, easy.id, 2), "already_answered");

    // Sahifa yangilansa: o'sha urinish, javob saqlangan holda qaytadi
    const resumed = await rpc("start_attempt", token, test.id);
    expect(resumed.attempt_id).toBe(attempt.attempt_id);
    expect(resumed.answers).toHaveLength(1);
    expect((await rpc("list_tests", token))[0].has_open_attempt).toBe(true);

    const hard = byText["const nima?"];
    await expectError(rpc("submit_answer", token, attempt.attempt_id, hard.id, 9), "invalid_option");
    const wrong = await rpc("submit_answer", token, attempt.attempt_id, hard.id, 3);
    expect(wrong).toMatchObject({ is_correct: false, correct_option: 0, points_awarded: 0 });

    const result = await rpc("finish_attempt", token, attempt.attempt_id);
    expect(result).toMatchObject({
      score: 10,
      max_score: 30,
      correct_count: 1,
      wrong_count: 1,
      question_count: 2,
      best_score: 10,
    });
    expect(result.review).toHaveLength(2);
    await expectError(rpc("submit_answer", token, attempt.attempt_id, hard.id, 0), "attempt_closed");

    // Boshqa o'quvchi bu urinishga javob bera olmaydi
    const other = await rpc("login_student", "ali", "secret123");
    await expectError(rpc("finish_attempt", other.token, attempt.attempt_id), "attempt_not_found");
  });

  it("vaqti tugagan urinish yopiladi, keyingi start yangi urinish ochadi", async () => {
    const { token } = await rpc("login_student", "vali", "parol1234");
    const [test] = await rpc("list_tests", token);
    const first = await rpc("start_attempt", token, test.id);

    await db.query("update quiz.attempts set ends_at = now() - interval '1 minute' where id = $1", [
      first.attempt_id,
    ]);
    await expectError(
      rpc("submit_answer", token, first.attempt_id, first.questions[0].id, 0),
      "attempt_closed",
    );

    const second = await rpc("start_attempt", token, test.id);
    expect(second.attempt_id).not.toBe(first.attempt_id);
    const closed = await db.query("select finished_at from quiz.attempts where id = $1", [
      first.attempt_id,
    ]);
    expect(closed.rows[0].finished_at).not.toBeNull();
  });

  it("admin: parol o'rnatilmaguncha kirib bo'lmaydi, 5 xatodan keyin bloklanadi", async () => {
    expect(await rpc("admin_login", "istalgan")).toEqual({ error: "admin_not_configured" });

    await db.query("select quiz.set_admin_password($1)", ["admin-parol-1"]);
    for (let i = 0; i < 5; i += 1) {
      expect(await rpc("admin_login", "xato")).toEqual({ error: "invalid_credentials" });
    }
    expect(await rpc("admin_login", "admin-parol-1")).toEqual({ error: "admin_locked" });

    await db.exec("update quiz.settings set admin_locked_until = now() - interval '1 second'");
    const { token } = await rpc("admin_login", "admin-parol-1");
    expect(await rpc("verify_admin", token)).toBe(true);
    expect(await rpc("verify_admin", "soxta")).toBe(false);

    // O'quvchi tokeni admin funksiyalariga yaramaydi
    const student = await rpc("login_student", "ali", "secret123");
    await expectError(rpc("admin_list_tests", student.token), "session_expired");
  });

  it("admin: test va savollarni boshqarish, natijalar va statistika", async () => {
    const { token } = await rpc("admin_login", "admin-parol-1");

    await expectError(rpc("admin_save_test", token, { title: "" }), "invalid_test");
    const test = await rpc("admin_save_test", token, {
      title: "Massivlar",
      description: "push, pop",
      seconds_per_question: 20,
    });
    expect(test).toMatchObject({ title: "Massivlar", is_published: false });

    const badQuestions = [
      { question: "", options: ["a", "b"], correct_option: 0 },
      { question: "Q", options: ["a", "A"], correct_option: 0 },
      { question: "Q", options: ["a", "b"], correct_option: 5 },
      { question: "Q", options: "a,b", correct_option: 0 },
      { question: "Q", options: ["a", "b"], correct_option: "x" },
    ];
    for (const bad of badQuestions) {
      await expectError(rpc("admin_save_question", token, { ...bad, test_id: test.id }), "invalid_question");
    }

    const added = await rpc("admin_add_questions", token, test.id, [
      { question: "push?", options: [" push() ", "pop()", "shift()", "map()"], correct_option: 0, points: 5, explanation: "oxiriga qo'shadi" },
      { question: "pop?", options: ["push()", "pop()"], correct_option: 1 },
    ]);
    expect(added).toBe(2);

    let questions = await rpc("admin_list_questions", token, test.id);
    expect(questions.map((q) => q.question)).toEqual(["push?", "pop?"]);
    expect(questions[0].options[0]).toBe("push()");

    const edited = await rpc("admin_save_question", token, { ...questions[1], question: "pop() nima qiladi?", points: 15 });
    expect(edited).toMatchObject({ question: "pop() nima qiladi?", points: 15 });
    await rpc("admin_delete_question", token, questions[0].id);
    questions = await rpc("admin_list_questions", token, test.id);
    expect(questions).toHaveLength(1);

    // Nashr qilinmagan test o'quvchiga ko'rinmaydi
    const student = await rpc("login_student", "ali", "secret123");
    expect((await rpc("list_tests", student.token)).map((t) => t.title)).not.toContain("Massivlar");
    await rpc("admin_save_test", token, { id: test.id, is_published: true });
    expect((await rpc("list_tests", student.token)).map((t) => t.title)).toContain("Massivlar");

    const attempt = await rpc("start_attempt", student.token, test.id);
    await rpc("submit_answer", student.token, attempt.attempt_id, attempt.questions[0].id, 1);
    await rpc("finish_attempt", student.token, attempt.attempt_id);

    const results = await rpc("admin_results", token, test.id);
    expect(results.summary).toMatchObject({ active_student_count: 1, attempt_count: 1 });
    expect(results.students[0]).toMatchObject({ nickname: "ali", best_percent: 100, last_percent: 100 });

    const stats = await rpc("admin_question_stats", token, test.id);
    expect(stats[0]).toMatchObject({ answer_count: 1, correct_count: 1, correct_percent: 100 });

    const history = await rpc("admin_student_attempts", token, results.students[0].id);
    expect(history.attempts.map((a) => a.test_title)).toContain("Massivlar");

    // Test o'chirilsa ham natija tarixda qoladi
    await rpc("admin_delete_test", token, test.id);
    const after = await rpc("admin_student_attempts", token, results.students[0].id);
    expect(after.attempts).toHaveLength(history.attempts.length);
  });

  it("admin o'quvchi parolini tiklaydi va eski sessiyalar yopiladi", async () => {
    const { token } = await rpc("admin_login", "admin-parol-1");
    const old = await rpc("login_student", "vali", "parol1234");
    const { students } = await rpc("admin_results", token, null);
    const vali = students.find((s) => s.nickname === "vali");

    await expectError(rpc("admin_reset_student_password", token, vali.id, "qisqa"), "weak_password");
    await rpc("admin_reset_student_password", token, vali.id, "yangiparol9");
    await expectError(rpc("get_student_session", old.token), "session_expired");
    await expectError(rpc("login_student", "vali", "parol1234"), "invalid_credentials");
    expect((await rpc("login_student", "vali", "yangiparol9")).student.nickname).toBe("vali");
  });

  // Supabase API so'rovlarida "safeupdate" yoqilgan: WHERE'siz UPDATE/DELETE xato beradi.
  // PGlite'da bu himoya yo'q, shuning uchun funksiyalar matnini tekshiramiz.
  it("funksiyalarda WHERE'siz UPDATE/DELETE yo'q (Supabase safeupdate)", async () => {
    const { rows } = await db.query(`
      select p.proname, p.prosrc
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname in ('public', 'quiz')
    `);
    const unsafe = rows.flatMap(({ proname, prosrc }) =>
      prosrc
        .split(";")
        .filter((statement) => /\b(update\s+quiz\.\w+|delete\s+from\s+quiz\.\w+)/i.test(statement))
        .filter((statement) => !/\bwhere\b/i.test(statement))
        .map((statement) => `${proname}: ${statement.trim().split("\n")[0]}`),
    );
    expect(unsafe).toEqual([]);
  });

  it("qayta ishga tushirish xavfsiz: ma'lumotlar ikki marta ko'chmaydi", async () => {
    const before = await db.query("select (select count(*) from quiz.students) s, (select count(*) from quiz.tests) t");
    await db.exec(MIGRATION);
    const after = await db.query("select (select count(*) from quiz.students) s, (select count(*) from quiz.tests) t");
    expect(after.rows[0]).toEqual(before.rows[0]);
  });
});

describe("migratsiya: options ustuni text[] bo'lsa", () => {
  it("savollar to'g'ri ko'chadi", async () => {
    const db = await createLegacyDatabase({ optionsType: "text[]" });
    await db.exec(MIGRATION);
    const rows = await db.query("select options, correct_option from quiz.questions order by created_at");
    expect(rows.rows[0]).toEqual({ options: ["3", "4", "5", "6"], correct_option: 1 });
  });
});

describe("toza baza (eski jadvallarsiz)", () => {
  it("xatosiz ishlaydi va bo'sh platforma yaratadi", async () => {
    const db = await PGlite.create({ extensions: { pgcrypto } });
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create schema extensions;
    `);
    await db.exec(MIGRATION);
    const counts = await db.query("select (select count(*) from quiz.tests) t, (select count(*) from quiz.students) s");
    expect(counts.rows[0]).toEqual({ t: 0, s: 0 });
  });
});
