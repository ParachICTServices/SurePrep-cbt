"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, Timer, AlertTriangle, Calculator, X, Check, ChevronRight, Flag } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MathText } from "@/app/components/MathText";
import { subjectService } from "@/app/lib/api/services/subjectService";
import { contentService } from "@/app/lib/api/services/contentService";
import { examService } from "@/app/lib/api/services/examService";

/* ------------------------------------------------------------------ */
/* Exam rules: edit these to match how each mock should work           */
/* ------------------------------------------------------------------ */
type ExamRule = {
  label: string;
  min: number; // fewest subjects allowed
  max: number; // most subjects allowed
  minutes: number; // total time for the whole mock
  perSubject: number; // questions loaded per subject
  counts?: { label: string; test: RegExp; count: number }[]; // subjects that get a different number
  required: { label: string; test: RegExp }[]; // compulsory subjects, matched by name
};

const ENGLISH = { label: "English", test: /english/i };
const MATHS = { label: "Mathematics", test: /math/i };

const EXAM_RULES: Record<string, ExamRule> = {
  // JAMB: 60 English + 3 x 40 = 180 questions in 2 hours
  jamb: {
    label: "JAMB",
    min: 4,
    max: 4,
    minutes: 120,
    perSubject: 40,
    counts: [{ label: "English", test: /english/i, count: 60 }],
    required: [ENGLISH],
  },
  waec: { label: "WAEC", min: 4, max: 9, minutes: 180, perSubject: 50, required: [ENGLISH, MATHS] },
  neco: { label: "NECO", min: 4, max: 9, minutes: 150, perSubject: 60, required: [ENGLISH, MATHS] },
};

function limitFor(rule: ExamRule, subjectName: string): number {
  return rule.counts?.find((c) => c.test.test(subjectName))?.count ?? rule.perSubject;
}

function getRule(examType: string): ExamRule {
  return (
    EXAM_RULES[examType] ?? {
      label: examType.toUpperCase(),
      min: 1,
      max: 9,
      minutes: 120,
      perSubject: 40,
      required: [],
    }
  );
}

/* ------------------------------------------------------------------ */
/* Subjects                                                            */
/* ------------------------------------------------------------------ */
type SubjectOption = { key: string; name: string; ids: string[]; count?: number }; // count = questions available

// Subjects stored under more than one name are merged into one option.
const SUBJECT_ALIASES: Record<string, string> = { maths: "mathematics", math: "mathematics" };

function groupSubjects(list: { id: string; name: string; count?: number }[]): SubjectOption[] {
  const map = new Map<string, SubjectOption>();
  for (const s of list) {
    const lower = s.name.trim().toLowerCase();
    const key = SUBJECT_ALIASES[lower] ?? lower;
    const existing = map.get(key);
    if (existing) {
      existing.ids.push(s.id);
      if (s.count !== undefined) existing.count = (existing.count ?? 0) + s.count;
    } else {
      map.set(key, { key, name: key === "mathematics" ? "Mathematics" : s.name, ids: [s.id], count: s.count });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

// Same source the Practice Centre uses. Passing no specialization returns every subject for the exam
// (the track filter would hide core subjects such as English for science students).
async function loadSubjectOptions(examType: string): Promise<SubjectOption[]> {
  const list: any[] = await contentService.getAvailableSubjects({ examType, specialization: undefined } as any);
  if (list.length === 0) throw new Error("No subjects returned");

  return groupSubjects(
    list.map((s) => ({
      id: String(s.id),
      name: s.name || "Unnamed Subject",
      count: s.questionCount,
    })),
  );
}

async function optionsFromIds(ids: string[]): Promise<SubjectOption[]> {
  const list = await Promise.all(
    ids.map(async (id) => {
      try {
        const s = await subjectService.getSubject(id);
        return { id, name: s.name || id };
      } catch {
        return { id, name: id };
      }
    }),
  );
  return groupSubjects(list);
}

function requiredKeys(options: SubjectOption[], rule: ExamRule): string[] {
  return rule.required
    .map((r) => options.find((o) => hasQuestions(o) && r.test.test(o.name))?.key)
    .filter((k): k is string => Boolean(k));
}

const hasQuestions = (o: SubjectOption) => o.count !== 0;

// A compulsory subject only blocks the student if it actually exists with questions.
function activeRequired(rule: ExamRule, options: SubjectOption[]) {
  return rule.required.filter((r) => options.some((o) => hasQuestions(o) && r.test.test(o.name)));
}

function isValidSelection(chosen: SubjectOption[], rule: ExamRule, options: SubjectOption[]): boolean {
  return (
    chosen.length >= rule.min &&
    chosen.length <= rule.max &&
    activeRequired(rule, options).every((r) => chosen.some((o) => r.test.test(o.name)))
  );
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

/* ------------------------------------------------------------------ */
/* Calculator                                                          */
/* ------------------------------------------------------------------ */
function CalculatorWidget({ onClose }: { onClose: () => void }) {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [newNumber, setNewNumber] = useState(true);

  const calculate = (a: number, b: number, op: string): number => {
    switch (op) {
      case "+": return a + b;
      case "-": return a - b;
      case "×": return a * b;
      case "÷": return b !== 0 ? a / b : 0;
      default: return b;
    }
  };

  const number = (num: string) => {
    if (newNumber) {
      setDisplay(num);
      setNewNumber(false);
    } else setDisplay(display === "0" ? num : display + num);
  };

  const operate = (op: string) => {
    const value = parseFloat(display);
    if (prev !== null && operation && !newNumber) {
      const result = calculate(prev, value, operation);
      setDisplay(String(result));
      setPrev(result);
    } else setPrev(value);
    setOperation(op);
    setNewNumber(true);
  };

  const equals = () => {
    if (prev !== null && operation) {
      setDisplay(String(calculate(prev, parseFloat(display), operation)));
      setPrev(null);
      setOperation(null);
      setNewNumber(true);
    }
  };

  const clear = () => {
    setDisplay("0");
    setPrev(null);
    setOperation(null);
    setNewNumber(true);
  };

  const decimal = () => {
    if (!display.includes(".")) {
      setDisplay(display + ".");
      setNewNumber(false);
    }
  };

  const backspace = () => {
    if (display.length > 1) setDisplay(display.slice(0, -1));
    else {
      setDisplay("0");
      setNewNumber(true);
    }
  };

  const key = "font-bold py-3 rounded-lg";
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="fixed top-24 right-4 z-30 w-80 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-2xl"
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-bold text-slate-700">
          <Calculator size={18} /> Calculator
        </h3>
        <button onClick={onClose} aria-label="Close calculator" className="rounded-lg p-1 hover:bg-slate-100">
          <X size={18} />
        </button>
      </div>
      <div className="mb-3 overflow-x-auto rounded-lg bg-slate-900 p-4 text-right font-mono text-2xl text-white">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-2">
        <button onClick={clear} className={`col-span-2 bg-red-500 text-white ${key}`}>C</button>
        <button onClick={backspace} className={`bg-slate-200 ${key}`}>←</button>
        <button onClick={() => operate("÷")} className={`bg-emerald-500 text-white ${key}`}>÷</button>
        {[7, 8, 9].map((n) => <button key={n} onClick={() => number(String(n))} className={`bg-slate-100 ${key}`}>{n}</button>)}
        <button onClick={() => operate("×")} className={`bg-emerald-500 text-white ${key}`}>×</button>
        {[4, 5, 6].map((n) => <button key={n} onClick={() => number(String(n))} className={`bg-slate-100 ${key}`}>{n}</button>)}
        <button onClick={() => operate("-")} className={`bg-emerald-500 text-white ${key}`}>-</button>
        {[1, 2, 3].map((n) => <button key={n} onClick={() => number(String(n))} className={`bg-slate-100 ${key}`}>{n}</button>)}
        <button onClick={() => operate("+")} className={`bg-emerald-500 text-white ${key}`}>+</button>
        <button onClick={() => number("0")} className={`col-span-2 bg-slate-100 ${key}`}>0</button>
        <button onClick={decimal} className={`bg-slate-100 ${key}`}>.</button>
        <button onClick={equals} className={`bg-blue-500 text-white ${key}`}>=</button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
type Stage = "boot" | "setup" | "exam" | "result";
type Result = {
  score: number;
  total: number;
  percentage: number;
  perSubject: { key: string; name: string; score: number; total: number; answered: number }[];
};

function MockExamContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const examType = (searchParams.get("type") || "mock").toLowerCase();
  const subsParam = searchParams.get("subs");
  const rule = useMemo(() => getRule(examType), [examType]);

  const [stage, setStage] = useState<Stage>("boot");
  const [options, setOptions] = useState<SubjectOption[]>([]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const [exam, setExam] = useState<{ subjects: SubjectOption[]; questions: Record<string, any[]> } | null>(null);
  const [activeKey, setActiveKey] = useState("");
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({});
  const [timeLeft, setTimeLeft] = useState(rule.minutes * 60);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submittingRef = useRef(false);
  const submitRef = useRef<() => void>(() => {});

  /* ---------- Load subjects, then either start or show setup ---------- */
  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      const urlIds = (subsParam ?? "").split(",").map((s) => s.trim()).filter(Boolean);

      let opts: SubjectOption[] = [];
      try {
        opts = await loadSubjectOptions(examType);
      } catch (err) {
        console.error("Could not load subject list:", err);
      }
      if (opts.length === 0 && urlIds.length > 0) opts = await optionsFromIds(urlIds);
      if (cancelled) return;

      setOptions(opts);
      const fromUrl = opts.filter((o) => o.ids.some((id) => urlIds.includes(id))).map((o) => o.key);
      const keys = Array.from(new Set([...requiredKeys(opts, rule), ...fromUrl])).slice(0, rule.max);
      setSelectedKeys(keys);

      // Old links that already carry a valid set of subjects still start straight away.
      const chosen = opts.filter((o) => keys.includes(o.key));
      if (urlIds.length > 0 && isValidSelection(chosen, rule, opts)) startExam(chosen);
      else setStage("setup");
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subsParam, examType, authLoading]);

  /* ---------- Start ---------- */
  const startExam = async (chosen: SubjectOption[]) => {
    setStarting(true);
    const questions: Record<string, any[]> = {};
    const empty: string[] = [];

    await Promise.all(
      chosen.map(async (opt) => {
        const batches = await Promise.all(
          opt.ids.map(async (id) => {
            try {
              // No limit here on purpose: the service slices from the start, so a limit would give the same
      // questions every time. We shuffle first and cut to size afterwards.
              return await contentService.getPracticeQuestions({ examType, subjectId: id });
            } catch (err) {
              console.error("Mock fetch error:", err);
              return [];
            }
          }),
        );
        const seen = new Set<string>();
        const merged = batches
          .flat()
          .map((q: any) => ({ ...q, id: q.id || q._id }))
          .filter((q: any) => {
            if (q.id && seen.has(q.id)) return false;
            if (q.id) seen.add(q.id);
            return true;
          });
        if (merged.length === 0) empty.push(opt.name);
        questions[opt.key] = shuffleArray(merged).slice(0, limitFor(rule, opt.name));
      }),
    );

    setStarting(false);
    if (Object.values(questions).every((q) => q.length === 0)) {
      toast.error("We couldn't load questions for these subjects. Please try again.");
      setStage("setup");
      return;
    }
    if (empty.length > 0) toast.warning(`No questions available yet for ${empty.join(", ")}.`);

    const rank = (o: SubjectOption) => {
      const i = rule.required.findIndex((r) => r.test.test(o.name));
      return i === -1 ? 99 : i;
    };
    const ordered = [...chosen].sort((a, b) => rank(a) - rank(b));

    submittingRef.current = false;
    setExam({ subjects: ordered, questions });
    setAnswers({});
    setActiveKey(ordered[0].key);
    setTimeLeft(rule.minutes * 60);
    setStage("exam");
    window.scrollTo({ top: 0 });
  };

  /* ---------- Submit ---------- */
  const submit = async () => {
    if (!exam || submittingRef.current) return;
    submittingRef.current = true;
    setShowConfirm(false);

    let score = 0;
    let total = 0;
    const history: Array<{
      questionId?: string;
      questionText: string;
      options: string[];
      correctOption: number;
      selectedOption: number;
      explanation: string;
      imageURL?: string;
    }> = [];

    const perSubject = exam.subjects.map((sub) => {
      const qs = exam.questions[sub.key] || [];
      const ans = answers[sub.key] || {};
      let subScore = 0;
      qs.forEach((q, idx) => {
        if (ans[idx] === q.correctOption) subScore++;
        history.push({
          questionId: q.id,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          selectedOption: ans[idx] ?? -1,
          explanation: q.explanation ?? "",
          imageURL: q.imageURL,
        });
      });
      score += subScore;
      total += qs.length;
      return { key: sub.key, name: sub.name, score: subScore, total: qs.length, answered: Object.keys(ans).length };
    });

    const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
    setResult({ score, total, percentage, perSubject });
    setStage("result");
    window.scrollTo({ top: 0 });

    try {
      await examService.submitTestResult({
        userId: user?.id ?? "",
        subject: `${examType.toUpperCase()} Mock Simulation`,
        subjectId: exam.subjects[0]?.ids[0] ?? "",
        score,
        totalQuestions: total,
        percentage,
        date: new Date().toISOString(),
        type: "mock",
        history,
      });
      toast.success(`Mock submitted. Score: ${score}/${total}`);
    } catch (e) {
      console.error("Error saving mock", e);
      toast.error("Your results are shown here, but we couldn't save them to your account.");
    }
  };
  // Always point at the latest submit so the timer never uses stale answers.
  submitRef.current = submit;

  /* ---------- Timer ---------- */
  useEffect(() => {
    if (stage !== "exam") return;
    const timer = setInterval(() => setTimeLeft((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage === "exam" && timeLeft === 0) submitRef.current();
  }, [stage, timeLeft]);

  /* ---------- Warn before leaving mid-exam ---------- */
  useEffect(() => {
    if (stage !== "exam") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [stage]);

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers((prev) => ({ ...prev, [activeKey]: { ...prev[activeKey], [qIdx]: optIdx } }));
  };

  const toggleSubject = (key: string) => {
    const option = options.find((o) => o.key === key);
    if (!option) return;
    const isRequired = rule.required.some((r) => r.test.test(option.name));
    setSelectedKeys((prev) => {
      if (prev.includes(key)) return isRequired ? prev : prev.filter((k) => k !== key);
      return prev.length >= rule.max ? prev : [...prev, key];
    });
  };

  /* ================================================================ */
  /* Render                                                            */
  /* ================================================================ */
  if (stage === "boot" || starting) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={48} />
        <p className="text-slate-500">{starting ? "Preparing your papers..." : "Loading..."}</p>
      </div>
    );
  }

  /* ---------- Setup ---------- */
  if (stage === "setup") {
    const chosen = options.filter((o) => selectedKeys.includes(o.key));
    const required = activeRequired(rule, options);
    const unavailable = rule.required.filter((r) => !required.includes(r)).map((r) => r.label);
    const missing = required.filter((r) => !chosen.some((o) => r.test.test(o.name))).map((r) => r.label);
    const valid = isValidSelection(chosen, rule, options);
    const requiredText = required.map((r) => r.label).join(" and ");
    const countText = rule.min === rule.max ? `${rule.max}` : `${rule.min} to ${rule.max}`;
    const questionsText = `${rule.perSubject} questions per subject${
      rule.counts?.length ? ` (${rule.counts.map((c) => `${c.count} for ${c.label}`).join(", ")})` : ""
    }`;

    let hint = "";
    if (missing.length > 0) hint = `${missing.join(" and ")} must be included.`;
    else if (chosen.length < rule.min) hint = `Choose at least ${rule.min - chosen.length} more subject${rule.min - chosen.length > 1 ? "s" : ""}.`;

    return (
      <div className="mx-auto max-w-3xl pb-20 pt-6">
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-slate-900">{rule.label} mock exam</h1>
          <p className="text-slate-500">
            Choose {countText} subjects.
            {requiredText && ` ${requiredText} ${required.length > 1 ? "are" : "is"} compulsory.`} You&apos;ll have{" "}
            {rule.minutes} minutes for up to {questionsText}.
          </p>
        </div>

        {options.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
            <AlertTriangle size={40} className="mx-auto mb-3 text-amber-500" />
            <p className="font-medium text-slate-700">We couldn&apos;t load the subject list.</p>
            <button
              onClick={() => router.refresh()}
              className="mt-4 rounded-xl bg-emerald-600 px-6 py-3 font-bold text-white hover:bg-emerald-700"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Subjects</h2>
              <span className="text-sm font-semibold text-slate-500">
                {chosen.length} of {rule.max} chosen
              </span>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {options.map((o) => {
                const selected = selectedKeys.includes(o.key);
                const isRequired = required.some((r) => r.test.test(o.name));
                const noQuestions = !hasQuestions(o);
                const disabled = noQuestions || (!selected && selectedKeys.length >= rule.max);
                return (
                  <button
                    key={o.key}
                    onClick={() => toggleSubject(o.key)}
                    disabled={disabled}
                    aria-pressed={selected}
                    className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                        : "border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
                    } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                        selected ? "border-emerald-500 bg-emerald-500 text-white" : "border-slate-300 bg-white"
                      }`}
                    >
                      {selected && <Check size={14} strokeWidth={3} />}
                    </span>
                    <span className="flex-1 font-semibold">{o.name}</span>
                    {noQuestions ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-500">
                        No questions yet
                      </span>
                    ) : (
                      isRequired && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-700">
                          Compulsory
                        </span>
                      )
                    )}
                  </button>
                );
              })}
            </div>

            {unavailable.length > 0 && (
              <p className="mb-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
                {unavailable.join(" and ")} {unavailable.length > 1 ? "have" : "has"} no questions for this exam yet, so{" "}
                {unavailable.length > 1 ? "they aren't" : "it isn't"} required for now.
              </p>
            )}

            <div className="flex flex-col items-end gap-2">
              {hint && <p className="text-sm font-medium text-amber-600">{hint}</p>}
              <button
                onClick={() => startExam(chosen)}
                disabled={!valid}
                className="flex items-center gap-2 rounded-xl bg-emerald-600 px-10 py-4 text-lg font-bold text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Start exam <ChevronRight size={20} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  /* ---------- Result ---------- */
  if (stage === "result" && result) {
    const passed = result.percentage >= 50;
    return (
      <div className="mx-auto max-w-2xl space-y-6 pb-20 pt-10">
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-center shadow-lg">
          <div
            className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${
              passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            }`}
          >
            {passed ? <Check size={48} /> : <AlertTriangle size={48} />}
          </div>
          <h1 className="mb-2 text-3xl font-bold text-slate-900">{passed ? "Well done!" : "Keep practising"}</h1>
          <p className="mb-8 text-slate-500">
            You scored <strong>{result.score}</strong> out of {result.total} ({result.percentage}%)
          </p>

          <div className="mb-8 space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-5 text-left">
            {result.perSubject.map((s) => {
              const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
              return (
                <div key={s.key}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className="text-slate-500">
                      {s.score}/{s.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => {
                setResult(null);
                setStage("setup");
              }}
              className="rounded-xl border border-slate-200 py-3 font-medium hover:border-emerald-300"
            >
              Take another mock
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="rounded-xl bg-emerald-600 py-3 font-bold text-white hover:bg-emerald-700"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ---------- Exam ---------- */
  if (!exam) return null;
  const currentQuestions = exam.questions[activeKey] || [];
  const activeIndex = exam.subjects.findIndex((s) => s.key === activeKey);
  const nextSubject = exam.subjects[activeIndex + 1];
  const activeName = exam.subjects[activeIndex]?.name ?? "";
  const answeredCount = (key: string) => Object.keys(answers[key] || {}).length;
  const unansweredTotal = exam.subjects.reduce(
    (n, s) => n + ((exam.questions[s.key]?.length || 0) - answeredCount(s.key)),
    0,
  );

  const goToSubject = (key: string) => {
    setActiveKey(key);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl pb-20">
      {/* Header: subject tabs, calculator, timer */}
      <div className="sticky top-4 z-20 mb-6 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        <div className="flex flex-col items-center justify-between gap-4 px-4 py-2 md:flex-row">
          <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
            {exam.subjects.map((s) => (
              <button
                key={s.key}
                onClick={() => goToSubject(s.key)}
                className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-bold transition ${
                  activeKey === s.key ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s.name}
                <span className="ml-2 rounded bg-white/20 px-1.5 py-0.5 text-xs">
                  {answeredCount(s.key)}/{exam.questions[s.key]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCalculator((v) => !v)}
              aria-label="Toggle calculator"
              className="rounded-lg bg-slate-100 p-2 text-slate-700 transition hover:bg-slate-200"
            >
              <Calculator size={20} />
            </button>
            <div
              className={`flex items-center gap-2 rounded-xl px-6 py-2 font-mono text-xl font-bold ${
                timeLeft < 300 ? "animate-pulse bg-red-100 text-red-600" : "bg-emerald-50 text-emerald-700"
              }`}
            >
              <Timer size={24} /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>{showCalculator && <CalculatorWidget onClose={() => setShowCalculator(false)} />}</AnimatePresence>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        {/* Questions */}
        <div>
          <div className="min-h-[60vh] rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-xl font-bold text-slate-400">{activeName} section</h2>

            {currentQuestions.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center text-slate-400">
                <AlertTriangle size={48} className="mb-4 text-amber-500" />
                <p>No questions found for this subject.</p>
              </div>
            ) : (
              <div className="space-y-12">
                {currentQuestions.map((q, qIdx) => (
                  <div key={q.id ?? qIdx} id={`q-${qIdx}`} className="scroll-mt-32 border-b border-slate-100 pb-8 last:border-0">
                    <div className="mb-4 flex gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-bold text-slate-500">
                        {qIdx + 1}
                      </span>
                      <div className="pt-1 text-lg font-medium text-slate-900">
                        <MathText text={q.questionText} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pl-12 md:grid-cols-2">
                      {q.options.map((opt: string, optIdx: number) => {
                        const isSelected = answers[activeKey]?.[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            onClick={() => handleSelect(qIdx, optIdx)}
                            className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-all ${
                              isSelected
                                ? "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 bg-white text-slate-600 hover:border-emerald-400"
                            }`}
                          >
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs ${
                                isSelected ? "border-white" : "border-slate-300"
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <MathText text={opt} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer: next subject or submit */}
          <div className="mt-8 flex flex-col-reverse items-stretch justify-end gap-3 sm:flex-row sm:items-center">
            {nextSubject && (
              <button
                onClick={() => goToSubject(nextSubject.key)}
                className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-8 py-4 font-bold text-slate-700 transition hover:border-emerald-300"
              >
                Next: {nextSubject.name} <ChevronRight size={20} />
              </button>
            )}
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-10 py-4 font-bold text-white shadow-lg shadow-red-200 transition hover:bg-red-700"
            >
              <Flag size={18} /> Submit all papers
            </button>
          </div>
        </div>

        {/* Question map */}
        <aside className="lg:sticky lg:top-32 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="mb-3 text-sm font-semibold text-slate-600">{activeName} questions</p>
            <div className="flex flex-wrap gap-2">
              {currentQuestions.map((q, i) => {
                const answered = answers[activeKey]?.[i] !== undefined;
                return (
                  <a
                    key={q.id ?? i}
                    href={`#q-${i}`}
                    aria-label={`Go to question ${i + 1}`}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold transition ${
                      answered
                        ? "bg-emerald-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-emerald-100"
                    }`}
                  >
                    {i + 1}
                  </a>
                );
              })}
            </div>
            <p className="mt-4 text-xs text-slate-400">Green means answered.</p>
          </div>
        </aside>
      </div>

      {/* Submit confirmation */}
      {showConfirm && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="mb-2 text-2xl font-bold text-slate-900">Submit all papers?</h2>
            <p className="mb-5 text-slate-500">
              {unansweredTotal > 0
                ? `You still have ${unansweredTotal} unanswered question${unansweredTotal > 1 ? "s" : ""}. You can't change answers after submitting.`
                : "You've answered every question. You can't change answers after submitting."}
            </p>

            <ul className="mb-6 divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50">
              {exam.subjects.map((s) => {
                const total = exam.questions[s.key]?.length || 0;
                const left = total - answeredCount(s.key);
                return (
                  <li key={s.key} className="flex items-center justify-between px-4 py-3 text-sm">
                    <span className="font-semibold text-slate-800">{s.name}</span>
                    <span className={left > 0 ? "font-medium text-amber-600" : "text-slate-500"}>
                      {left > 0 ? `${left} unanswered` : "Complete"}
                    </span>
                  </li>
                );
              })}
            </ul>

            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl border-2 border-slate-200 px-4 py-3 font-bold text-slate-700 hover:border-emerald-300"
              >
                Keep working
              </button>
              <button
                onClick={submit}
                className="flex-1 rounded-xl bg-red-600 px-4 py-3 font-bold text-white hover:bg-red-700"
              >
                Submit now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MockExamPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-center">Loading exam environment...</div>}>
      <MockExamContent />
    </React.Suspense>
  );
}