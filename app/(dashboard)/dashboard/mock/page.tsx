"use client";
import { useState, useEffect, Suspense } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Loader2, CheckCircle, AlertCircle, Play,
  GraduationCap, BookOpen, Sparkles, Briefcase, Globe,
  Timer, ArrowLeft
} from "lucide-react";
import Link from "next/link";

// ── Exam type config ──────────────────────────────────────────────────────────
const EXAM_CONFIG = {
  jamb: {
    label: "JAMB / UTME",
    subtitle: "Select your 4 subject combination",
    icon: GraduationCap,
    color: "emerald",
    duration: "2 Hours (120 mins)",
    subjectCount: 4,
    questionsPerSubject: 40, // 40 × 4 = 160 (approx JAMB format)
    multiSubject: true,
    gradient: "from-slate-900 to-slate-800",
    accent: "bg-emerald-500",
    ringColor: "border-emerald-500 bg-emerald-50 text-emerald-900",
  },
  waec: {
    label: "WAEC / SSCE",
    subtitle: "Select 1 subject to practise",
    icon: BookOpen,
    color: "sky",
    duration: "3 Hours (180 mins)",
    subjectCount: 1,
    questionsPerSubject: 50,
    multiSubject: false,
    gradient: "from-blue-900 to-blue-800",
    accent: "bg-sky-500",
    ringColor: "border-sky-500 bg-sky-50 text-sky-900",
  },
  neco: {
    label: "NECO",
    subtitle: "Select 1 subject to practise",
    icon: Sparkles,
    color: "violet",
    duration: "2.5 Hours (150 mins)",
    subjectCount: 1,
    questionsPerSubject: 60,
    multiSubject: false,
    gradient: "from-violet-900 to-violet-800",
    accent: "bg-violet-500",
    ringColor: "border-violet-500 bg-violet-50 text-violet-900",
  },
  interview: {
    label: "Job Interview Prep",
    subtitle: "Select a topic area to practise",
    icon: Briefcase,
    color: "amber",
    duration: "45 Mins",
    subjectCount: 1,
    questionsPerSubject: 40,
    multiSubject: false,
    gradient: "from-amber-800 to-orange-900",
    accent: "bg-amber-500",
    ringColor: "border-amber-500 bg-amber-50 text-amber-900",
  },
  general: {
    label: "General Knowledge",
    subtitle: "Pick any topic or start with all questions",
    icon: Globe,
    color: "teal",
    duration: "No Time Limit",
    subjectCount: 1,
    questionsPerSubject: 999,
    multiSubject: false,
    gradient: "from-teal-800 to-emerald-900",
    accent: "bg-teal-500",
    ringColor: "border-teal-500 bg-teal-50 text-teal-900",
  },
} as const;

type ExamType = keyof typeof EXAM_CONFIG;

// ── Inner component (uses useSearchParams — must be wrapped in Suspense) ──────
function MockSetupInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const rawType = searchParams.get("type") ?? "jamb";
  const examType: ExamType = (rawType in EXAM_CONFIG ? rawType : "jamb") as ExamType;
  const config = EXAM_CONFIG[examType];
  const Icon = config.icon;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const snap = await getDocs(collection(db, "subjects"));
        const data = snap.docs.map((doc) => doc.data());
        setSubjects(data);

        if (examType === "jamb") {
          const eng = data.find((s) => s.id.includes("english"));
          if (eng) setSelected([eng.id]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [examType]);

  const toggleSubject = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      if (config.multiSubject) {
        if (selected.length >= config.subjectCount) return;
        setSelected([...selected, id]);
      } else {
        // Single-select: replace
        setSelected([id]);
      }
    }
  };

  const canStart =
    config.multiSubject
      ? selected.length === config.subjectCount
      : selected.length === 1;

  const startExam = () => {
    if (!canStart) return;
    const query = selected.join(",");
    router.push(`/dashboard/mock/play?subs=${query}&type=${examType}`);
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Back link */}
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"
      >
        <ArrowLeft size={16} /> Back to Practice Centre
      </Link>

      {/* Header */}
      <div
        className={`bg-gradient-to-r ${config.gradient} rounded-3xl p-8 flex items-center gap-6`}
      >
        <div className="p-4 rounded-2xl bg-white/10">
          <Icon size={36} className="text-white" />
        </div>
        <div>
          <p className="text-white/60 text-sm font-bold uppercase tracking-widest mb-1">
            Exam Simulation
          </p>
          <h1 className="text-3xl font-bold text-white">{config.label}</h1>
          <p className="text-white/70 mt-1">{config.subtitle}</p>
        </div>
      </div>

      {/* Setup card */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {/* Selection counter */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-slate-800">
            {config.multiSubject ? "Choose Subjects" : "Choose a Subject"}
          </h2>
          {config.multiSubject && (
            <span
              className={`text-sm font-bold ${
                canStart ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {selected.length}/{config.subjectCount} Selected
            </span>
          )}
        </div>

        {/* Subject grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {subjects.length === 0 ? (
            <p className="col-span-3 text-center text-slate-400 py-8">
              No subjects found. Please add subjects via the Admin Portal.
            </p>
          ) : (
            subjects.map((sub) => {
              const isSelected = selected.includes(sub.id);
              return (
                <button
                  key={sub.id}
                  onClick={() => toggleSubject(sub.id)}
                  className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all
                    ${isSelected ? config.ringColor + " border-current" : "border-slate-100 hover:border-slate-300 text-slate-600"}
                  `}
                >
                  <span className="font-bold capitalize">{sub.name}</span>
                  {isSelected && (
                    <CheckCircle size={20} className="text-current flex-shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <AlertCircle size={16} />
            <span>
              {config.multiSubject
                ? `You must pick exactly ${config.subjectCount} subjects · `
                : "Select 1 subject · "}
              {config.duration}
            </span>
          </div>

          <button
            onClick={startExam}
            disabled={!canStart}
            className={`px-8 py-3 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 text-white
              ${config.accent} hover:opacity-90`}
          >
            Start Exam <Play size={18} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Default export wrapped in Suspense (required for useSearchParams) ─────────
export default function MockSetup() {
  return (
    <Suspense
      fallback={
        <div className="p-10 flex justify-center">
          <Loader2 className="animate-spin text-emerald-600" size={40} />
        </div>
      }
    >
      <MockSetupInner />
    </Suspense>
  );
}