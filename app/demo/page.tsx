"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Lock,
  LogIn,
  UserPlus,
  RotateCcw,
  Flag,
  Loader2,
} from "lucide-react";
import { ThemeToggle } from "@/app/components/theme-toggle";

type DemoQuestion = {
  id: string;
  subject: string;
  text: string;
  options: string[];
  explanation: string;
};

type DemoResult = {
  score: number;
  total: number;
  answered: number;
  percentage: number;
  results: {
    id: string;
    subject: string;
    selectedOption: number | null;
    isCorrect: boolean;
  }[];
};

// Subjects that go by more than one name in the question bank.
// Add any other duplicates here: lowercase variant -> shared key + display label.
const SUBJECT_ALIASES: Record<string, { key: string; label: string }> = {
  maths: { key: "mathematics", label: "Mathematics" },
  math: { key: "mathematics", label: "Mathematics" },
  mathematics: { key: "mathematics", label: "Mathematics" },
};

function resolveSubject(subject: string): { key: string; label: string } {
  const normalized = subject.trim() || "General";
  const alias = SUBJECT_ALIASES[normalized.toLowerCase()];
  return alias ?? { key: normalized.toLowerCase(), label: normalized };
}

export default function DemoPage() {
  const [questionsBySubject, setQuestionsBySubject] = useState<Record<string, DemoQuestion[]>>({});
  const [activeSubject, setActiveSubject] = useState<string | null>(null);
  const [indexBySubject, setIndexBySubject] = useState<Record<string, number>>({});
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [finished, setFinished] = useState(false);
  const totalQuestions = useMemo(
    () => Object.values(questionsBySubject).reduce((n, list) => n + list.length, 0),
    [questionsBySubject],
  );

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setSubmitError(null);
    try {
      const response = await fetch("/api/demo", { cache: "no-store" });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(payload?.error ?? "Too many demo requests. Please wait a moment and try again.");
        }
        throw new Error(payload?.error ?? "The demo could not be loaded. Please try again.");
      }
      if (
        typeof payload?.sessionId !== "string" ||
        !Array.isArray(payload.questions) ||
        payload.questions.length === 0
      ) {
        throw new Error("No demo questions are available right now. Please try again later.");
      }

      const questionsBySubject: Record<string, DemoQuestion[]> = {};
      for (const question of payload.questions as DemoQuestion[]) {
        const { key, label } = resolveSubject(question.subject);
        const subjectQuestions = questionsBySubject[key] ?? [];
        subjectQuestions.push({ ...question, subject: label });
        questionsBySubject[key] = subjectQuestions;
      }

      setQuestionsBySubject(questionsBySubject);
      setActiveSubject(Object.keys(questionsBySubject)[0] ?? null);
      setIndexBySubject({});
      setAnswers({});
      setResult(null);
      setSessionId(payload.sessionId);
      setFinished(false);
    } catch (loadError) {
      console.error("Failed to load the public demo.", loadError);
      setQuestionsBySubject({});
      setSessionId(null);
      setError(loadError instanceof Error ? loadError.message : "The demo could not be loaded. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const subjects = useMemo(() => Object.keys(questionsBySubject), [questionsBySubject]);
  const ready = !isLoading && !error && subjects.length > 0;

  const questions = activeSubject ? questionsBySubject[activeSubject] ?? [] : [];
  const currentIndex = activeSubject ? indexBySubject[activeSubject] ?? 0 : 0;
  const current = questions[currentIndex];
  const selectedOption = current ? answers[current.id] : undefined;
  const isAnswered = selectedOption !== undefined;

  const stats = useMemo(() => {
    const resultsById = new Map(result?.results.map((item) => [item.id, item.isCorrect]) ?? []);
    const perSubject = subjects.map((key) => {
      const list = questionsBySubject[key];
      const answered = list.filter((q) => answers[q.id] !== undefined).length;
      const correct = list.filter((q) => resultsById.get(q.id) === true).length;
      return { key, name: list[0]?.subject ?? key, total: list.length, answered, correct };
    });
    return {
      perSubject,
      total: perSubject.reduce((n, s) => n + s.total, 0),
      answered: perSubject.reduce((n, s) => n + s.answered, 0),
      correct: perSubject.reduce((n, s) => n + s.correct, 0),
    };
  }, [subjects, questionsBySubject, answers, result]);

  const goTo = (index: number) => {
    if (!activeSubject) return;
    setIndexBySubject((prev) => ({ ...prev, [activeSubject]: index }));
  };

  const handleSelect = (idx: number) => {
    if (!current || isAnswered) return;
    setAnswers((prev) => ({ ...prev, [current.id]: idx }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
    else setShowConfirm(true);
  };

  const confirmFinish = async () => {
    if (!sessionId || isSubmitting) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await fetch("/api/demo/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, answers }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 410 || payload?.code === "SESSION_EXPIRED") setSessionId(null);
        if (response.status === 429) {
          throw new Error(payload?.error ?? "Too many demo submissions. Please wait a moment and try again.");
        }
        throw new Error(payload?.error ?? "Your result could not be submitted. Please try again.");
      }
      if (!Array.isArray(payload?.results) || payload.total !== totalQuestions) {
        throw new Error("The demo returned an invalid result. Please try again.");
      }

      setResult(payload as DemoResult);
      setShowConfirm(false);
      setFinished(true);
      window.scrollTo({ top: 0 });
    } catch (submitFailure) {
      console.error("Failed to submit the public demo.", submitFailure);
      setSubmitError(submitFailure instanceof Error ? submitFailure.message : "Your result could not be submitted.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const restart = () => {
    setAnswers({});
    setIndexBySubject({});
    setResult(null);
    setFinished(false);
    setShowConfirm(false);
    void load();
    window.scrollTo({ top: 0 });
  };

  const percent = result?.percentage ?? 0;
  const passed = Boolean(result && result.total > 0 && percent >= 50);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50 font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      {/* Soft emerald glow behind content */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.14),transparent)] dark:bg-[radial-gradient(60%_60%_at_50%_0%,rgba(16,185,129,0.10),transparent)]"
      />

      {/* Top nav + subject bar */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-emerald-100 bg-white/85 backdrop-blur-md dark:border-emerald-900/40 dark:bg-slate-950/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="text-xl font-bold tracking-tight text-emerald-600 dark:text-emerald-400">
            Sure Prep
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            <span className="hidden rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 md:block">
              Demo mode
            </span>
            <Link
              href="/"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Exit demo
            </Link>
          </div>
        </div>

        {ready && !finished && (
          <div className="border-t border-slate-100 dark:border-slate-800/80">
            <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
              <nav
                aria-label="Subjects"
                className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {stats.perSubject.map((s) => {
                  const active = s.key === activeSubject;
                  return (
                    <button
                      key={s.key}
                      onClick={() => setActiveSubject(s.key)}
                      aria-current={active ? "true" : undefined}
                      className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                        active
                          ? "bg-emerald-600 text-white shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                          : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                      }`}
                    >
                      <span className="capitalize">{s.name}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                          active
                            ? "bg-white/20 text-white"
                            : "bg-white text-slate-500 dark:bg-slate-900 dark:text-slate-400"
                        }`}
                      >
                        {s.answered}/{s.total}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <button
                onClick={() => setShowConfirm(true)}
                className="hidden shrink-0 items-center gap-2 rounded-lg border-2 border-emerald-600 px-4 py-1.5 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40 sm:flex"
              >
                <Flag size={16} /> Finish
              </button>
            </div>
          </div>
        )}
      </header>

      <main className={`relative mx-auto max-w-3xl px-4 pb-20 sm:px-6 ${ready && !finished ? "pt-36" : "pt-28"}`}>
        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-24 text-center">
            <Loader2 className="mb-4 animate-spin text-emerald-600 dark:text-emerald-400" size={36} />
            <p className="font-medium text-slate-600 dark:text-slate-300">Getting your questions ready</p>
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <AlertCircle size={28} />
            </div>
            <h1 className="mb-2 text-xl font-bold">We couldn&apos;t load the demo</h1>
            <p className="mb-6 text-slate-500 dark:text-slate-400">{error}</p>
            <button
              onClick={load}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && subjects.length === 0 && (
          <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h1 className="mb-2 text-xl font-bold">No questions yet</h1>
            <p className="mb-6 text-slate-500 dark:text-slate-400">
              Demo questions are unavailable right now. Please try again later.
            </p>
            <button
              onClick={load}
              className="rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white transition hover:bg-emerald-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Quiz */}
        {ready && !finished && current && (
          <div>
            {/* Subject progress */}
            <div className="mb-6">
              <div className="mb-2 flex items-baseline justify-between">
                <h1 className="text-lg font-bold text-slate-900 capitalize dark:text-white">{current.subject}</h1>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{
                    width: `${
                      (questions.filter((q) => answers[q.id] !== undefined).length / questions.length) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Question card */}
            <section className="relative mb-6 overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm shadow-slate-200/60 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none md:p-10">
              <h2 className="mb-8 text-xl font-medium leading-relaxed text-slate-900 dark:text-white md:text-2xl">
                {current.text}
              </h2>

              <div className="space-y-3">
                {current.options.map((opt, idx) => {
                  let style =
                    "border-slate-200 bg-white text-slate-900 hover:border-emerald-300 hover:bg-emerald-50/50 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-100 dark:hover:border-emerald-600 dark:hover:bg-emerald-950/20";
                  if (isAnswered) {
                    if (idx === selectedOption)
                      style =
                        "border-emerald-500 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100";
                    else style = "border-slate-100 bg-white opacity-50 dark:border-slate-800 dark:bg-slate-900/40";
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelect(idx)}
                      disabled={isAnswered}
                      className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${style}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-bold ${
                          isAnswered && idx === selectedOption
                            ? "border-emerald-500 bg-emerald-500 text-white"
                            : "border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span className="flex-1">{opt}</span>
                    </button>
                  );
                })}
              </div>

              {/* Locked explanation */}
              {isAnswered && (
                <div className="relative mt-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60 animate-in fade-in duration-300">
                  <div className="mb-2 flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                    <Lock size={16} className="text-emerald-600 dark:text-emerald-400" /> Explanation
                  </div>
                  <p className="select-none text-slate-400 blur-sm dark:text-slate-500" aria-hidden>
                    {current.explanation} This is why Sure Prep is the best platform for your success.
                  </p>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Link
                      href="/register"
                      className="rounded-full bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-lg transition-transform hover:scale-105 dark:bg-white dark:text-slate-900"
                    >
                      Sign up to unlock
                    </Link>
                  </div>
                </div>
              )}
            </section>

            {/* Prev / Next */}
            <div className="mb-10 flex items-center justify-between gap-3">
              <button
                onClick={() => goTo(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-5 py-3 font-bold text-slate-700 transition hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-emerald-600"
              >
                <ChevronLeft size={20} /> Previous
              </button>

              <button
                onClick={handleNext}
                disabled={!isAnswered}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none dark:shadow-emerald-900/30"
              >
                {currentIndex === questions.length - 1 ? "Finish" : "Next question"}
                {currentIndex === questions.length - 1 ? <Flag size={18} /> : <ChevronRight size={20} />}
              </button>
            </div>

            {/* Question navigator */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">Jump to a question</p>
              <div className="flex flex-wrap gap-2">
                {questions.map((q, i) => {
                  const a = answers[q.id];
                  const isCurrent = i === currentIndex;
                  let tone =
                    "bg-slate-100 text-slate-600 hover:bg-emerald-100 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-emerald-950/50";
                  if (a !== undefined) {
                    const questionResult = result?.results.find((item) => item.id === q.id);
                    tone = questionResult
                      ? questionResult.isCorrect
                        ? "bg-emerald-500 text-white"
                        : "bg-red-500 text-white"
                      : "bg-emerald-200 text-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200";
                  }
                  return (
                    <button
                      key={q.id}
                      onClick={() => goTo(i)}
                      aria-label={`Question ${i + 1}`}
                      aria-current={isCurrent ? "true" : undefined}
                      className={`h-9 w-9 rounded-lg text-xs font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${tone} ${
                        isCurrent ? "ring-2 ring-emerald-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900" : ""
                      }`}
                    >
                      {i + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile finish */}
            <button
              onClick={() => setShowConfirm(true)}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 px-4 py-3 font-bold text-emerald-700 transition hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40 sm:hidden"
            >
              <Flag size={16} /> Finish and see results
            </button>
          </div>
        )}

        {/* Results */}
        {ready && finished && (
          <div className="animate-in zoom-in duration-300">
            <div className="rounded-3xl border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-100/50 dark:border-emerald-900/40 dark:bg-slate-900 dark:shadow-none md:p-10">
              <div className="mb-8 flex flex-col items-center text-center">
                <div className="relative mb-5 h-36 w-36">
                  <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                    <circle cx="60" cy="60" r="52" fill="none" strokeWidth="10" className="stroke-slate-100 dark:stroke-slate-800" />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 52}
                      strokeDashoffset={2 * Math.PI * 52 * (1 - percent / 100)}
                      className={`transition-all duration-700 ${passed ? "stroke-emerald-500" : "stroke-amber-500"}`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-slate-900 dark:text-white">{percent}%</span>
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">score</span>
                  </div>
                </div>

                <h1 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {passed ? "Nice work!" : "Good start, keep going"}
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                  You got{" "}
                  <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                    {result?.score ?? 0}/{result?.total ?? 0}
                  </span>{" "}
                  correct answers
                  {result && result.total - result.answered > 0 && ` · ${result.total - result.answered} left unanswered`}
                </p>
              </div>

              {/* Subject breakdown */}
              <div className="mb-6 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/50">
                {stats.perSubject.map((s) => {
                  const pct = s.answered > 0 ? Math.round((s.correct / s.answered) * 100) : 0;
                  return (
                    <div key={s.key}>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          {s.answered === 0 ? "Not attempted" : `${s.correct}/${s.answered} correct`}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Locked analytics */}
              <div className="mb-8 space-y-3 rounded-2xl border border-slate-100 bg-slate-50 p-5 opacity-80 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="flex items-center justify-between blur-[2px]">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Speed analysis</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Top 10%</span>
                </div>
                <div className="flex items-center justify-between blur-[2px]">
                  <span className="text-sm text-slate-500 dark:text-slate-400">Topic strength</span>
                  <span className="text-sm font-bold text-green-600 dark:text-green-400">Excellent</span>
                </div>
                <p className="flex items-center justify-center gap-1 text-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <Lock size={12} /> Full analytics are locked. Create an account to see them.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Link
                  href="/register"
                  className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:-translate-y-0.5 hover:bg-emerald-700 dark:shadow-emerald-900/30"
                >
                  <UserPlus size={20} /> Create free account
                </Link>
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 rounded-xl border-2 border-emerald-600 py-4 text-lg font-bold text-emerald-700 transition-all hover:-translate-y-0.5 hover:bg-emerald-50 dark:border-emerald-500 dark:text-emerald-300 dark:hover:bg-emerald-950/40"
                >
                  <LogIn size={20} /> Log in
                </Link>
              </div>

              <div className="mt-6 flex flex-col items-center gap-3">
                <button
                  onClick={restart}
                  className="flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-emerald-600 dark:text-slate-400 dark:hover:text-emerald-400"
                >
                  <RotateCcw size={14} /> Try the demo again
                </button>
                <p className="text-sm text-slate-400 dark:text-slate-500">Join 1,000+ students practising today.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Finish confirmation */}
      {showConfirm && !finished && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="finish-title"
          className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm animate-in fade-in duration-200 sm:items-center"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200 dark:border-slate-800 dark:bg-slate-900 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <Flag size={22} />
            </div>
            <h2 id="finish-title" className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">
              Are you done?
            </h2>
            <p className="mb-5 text-slate-500 dark:text-slate-400">
              Have you answered all the questions you want to, in every subject? You&apos;ll see your results next.
            </p>

            <ul className="mb-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50 dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-800/50">
              {stats.perSubject.map((s) => (
                <li key={s.key} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{s.name}</span>
                  <span
                    className={
                      s.answered === 0
                        ? "font-medium text-amber-600 dark:text-amber-400"
                        : "text-slate-500 dark:text-slate-400"
                    }
                  >
                    {s.answered === 0 ? "Not started" : `${s.answered} of ${s.total} answered`}
                  </span>
                </li>
              ))}
            </ul>

            {submitError && (
              <p role="alert" className="mb-5 text-sm font-medium text-red-600 dark:text-red-400">
                {submitError}
              </p>
            )}

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-700 transition hover:border-emerald-300 dark:border-slate-700 dark:text-slate-200 dark:hover:border-emerald-600"
              >
                Keep practising
              </button>
              <button
                onClick={!sessionId ? restart : confirmFinish}
                disabled={isSubmitting}
                className="flex-1 rounded-xl bg-emerald-600 px-4 py-3 font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-emerald-900/30"
              >
                {!sessionId ? "Restart demo" : isSubmitting ? "Submitting..." : "Yes, show my results"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}