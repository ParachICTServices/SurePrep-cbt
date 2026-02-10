"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import {
  BookOpen, Lock, Zap, Timer, Crown, Loader2,
  GraduationCap, Briefcase, Globe, ChevronRight, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

const EXAM_TYPES = [
  {
    id: "jamb",
    label: "JAMB / UTME",
    badge: "University Entry",
    description: "4 subjects under real timed conditions. The ultimate test of speed and accuracy.",
    duration: "2 Hours",
    questions: "180 Questions",
    gradient: "from-slate-900 to-slate-800",
    icon: GraduationCap,
    premiumOnly: true,
    glowColor: "bg-emerald-500",
    borderColor: "border-slate-700",
    badgeBg: "bg-emerald-500 text-white",
    textColor: "text-white",
    subTextColor: "text-slate-300",
  },
  {
    id: "waec",
    label: "WAEC / SSCE",
    badge: "Senior Secondary",
    description: "Practice WAEC-style questions per subject with structured theory and objectives.",
    duration: "3 Hours",
    questions: "50 Questions",
    gradient: "from-blue-900 to-blue-800",
    icon: BookOpen,
    premiumOnly: true,
    glowColor: "bg-sky-500",
    borderColor: "border-blue-700",
    badgeBg: "bg-sky-400 text-white",
    textColor: "text-white",
    subTextColor: "text-blue-200",
  },
  {
    id: "neco",
    label: "NECO",
    badge: "National Exams",
    description: "Targeted NECO past questions with detailed explanations for each answer.",
    duration: "2.5 Hours",
    questions: "60 Questions",
    gradient: "from-violet-900 to-violet-800",
    icon: Sparkles,
    premiumOnly: true,
    glowColor: "bg-violet-400",
    borderColor: "border-violet-700",
    badgeBg: "bg-violet-400 text-white",
    textColor: "text-white",
    subTextColor: "text-violet-200",
  },
  {
    id: "interview",
    label: "Job Interview",
    badge: "Career Prep",
    description: "Sharpen your verbal reasoning, aptitude, and critical thinking for job tests.",
    duration: "45 Mins",
    questions: "40 Questions",
    gradient: "from-amber-800 to-orange-900",
    icon: Briefcase,
    premiumOnly: true,
    glowColor: "bg-amber-400",
    borderColor: "border-amber-700",
    badgeBg: "bg-amber-400 text-white",
    textColor: "text-white",
    subTextColor: "text-amber-200",
  },
  {
    id: "general",
    label: "General Knowledge",
    badge: "Open Practice",
    description: "Broad knowledge questions spanning science, history, current affairs, and more.",
    duration: "No Limit",
    questions: "Unlimited",
    gradient: "from-teal-800 to-emerald-900",
    icon: Globe,
    premiumOnly: false,
    glowColor: "bg-teal-400",
    borderColor: "border-teal-700",
    badgeBg: "bg-teal-400 text-white",
    textColor: "text-white",
    subTextColor: "text-teal-200",
  },
];

export default function PracticeSelection() {
  const { userData } = useAuth();
  const router = useRouter();
  const isPremium = userData?.subscriptionStatus === "premium";

  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const fetchedSubjects = querySnapshot.docs.map((doc) => doc.data());
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleExamClick = (exam: (typeof EXAM_TYPES)[0]) => {
    if (exam.premiumOnly && !isPremium) {
      router.push("/dashboard/upgrade");
    } else {
      router.push(`/dashboard/mock?type=${exam.id}`);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Centre</h1>
          <p className="text-slate-500 mt-2">
            Choose an exam type or pick a subject to start practising.
          </p>
        </div>
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Lock size={14} />
            <span>Free Mode: Limited Access</span>
          </div>
        )}
      </div>

      {/* Exam Type Simulations */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Timer size={20} className="text-slate-400" />
          Full Exam Simulations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {EXAM_TYPES.map((exam) => {
            const Icon = exam.icon;
            const locked = exam.premiumOnly && !isPremium;

            return (
              <div
                key={exam.id}
                onClick={() => handleExamClick(exam)}
                className={`
                  relative overflow-hidden bg-gradient-to-br ${exam.gradient}
                  rounded-2xl p-6 cursor-pointer group border ${exam.borderColor}
                  transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                `}
              >
                {/* Glow blob */}
                <div
                  className={`absolute -top-8 -right-8 h-40 w-40 ${exam.glowColor} rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity`}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col gap-4">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div className={`p-2.5 rounded-xl bg-white/10 ${exam.textColor}`}>
                      <Icon size={22} />
                    </div>

                    {locked ? (
                      <span className="flex items-center gap-1 bg-white/10 text-white text-[10px] font-bold px-2 py-1 rounded-full">
                        <Lock size={9} /> Premium
                      </span>
                    ) : exam.premiumOnly ? (
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${exam.badgeBg}`}
                      >
                        <Crown size={9} /> Premium
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-1 rounded-full">
                        FREE
                      </span>
                    )}
                  </div>

                  {/* Title & badge */}
                  <div>
                    <span
                      className={`text-[10px] font-bold tracking-widest uppercase ${exam.subTextColor} mb-1 block`}
                    >
                      {exam.badge}
                    </span>
                    <h3 className={`text-xl font-bold ${exam.textColor}`}>{exam.label}</h3>
                    <p className={`text-sm mt-1 leading-relaxed ${exam.subTextColor}`}>
                      {exam.description}
                    </p>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                    <span className={`text-xs flex items-center gap-1 ${exam.subTextColor}`}>
                      <Timer size={11} /> {exam.duration}
                    </span>
                    <span className={`text-xs flex items-center gap-1 ${exam.subTextColor}`}>
                      <BookOpen size={11} /> {exam.questions}
                    </span>
                    <span
                      className={`ml-auto text-xs font-bold flex items-center gap-1 ${exam.textColor} opacity-0 group-hover:opacity-100 transition-opacity`}
                    >
                      {locked ? "Unlock" : "Start"}
                      <ChevronRight size={13} />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subject Practice */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-slate-400" /> Subject Practice
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.length > 0 ? (
            subjects.map((sub) => (
              <Link
                key={sub.id}
                href={`/dashboard/practice/${sub.id}`}
                className="group bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-4 relative z-10">
                  <div className={`p-3 rounded-xl ${sub.color || "bg-blue-100 text-blue-600"}`}>
                    <BookOpen size={24} />
                  </div>
                  {isPremium ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full flex items-center gap-1">
                      <Crown size={10} /> FULL ACCESS
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
                      LIMITED
                    </span>
                  )}
                </div>

                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors capitalize">
                    {sub.name}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">Click to start practice session.</p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-end">
                    <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start <Zap size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-3 text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">
              <p>No exams found in the database.</p>
              <p className="text-sm mt-1">Please use the Admin Portal to add subjects.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}