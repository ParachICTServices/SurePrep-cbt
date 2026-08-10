"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, CheckCircle, AlertCircle, Play, GraduationCap, BookOpen, Sparkles, Briefcase, Globe, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { subjectService } from "@/app/lib/api/services/subjectService";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

const EXAM_CONFIG = {
  jamb: { label: "JAMB / UTME", subtitle: "Select your 4 subject combination", icon: GraduationCap, duration: "2 Hours", subjectCount: 4, multiSubject: true, gradient: "from-slate-900 to-slate-800", accent: "bg-emerald-600", ringColor: "border-emerald-500 bg-emerald-50 text-emerald-900" },
  waec: { label: "WAEC / SSCE", subtitle: "Select 1 subject", icon: BookOpen, duration: "3 Hours", subjectCount: 1, multiSubject: false, gradient: "from-blue-900 to-blue-800", accent: "bg-sky-600", ringColor: "border-sky-500 bg-sky-50 text-sky-900" },
  neco: { label: "NECO", subtitle: "Select 1 subject", icon: Sparkles, duration: "2.5 Hours", subjectCount: 1, multiSubject: false, gradient: "from-violet-900 to-violet-800", accent: "bg-violet-600", ringColor: "border-violet-500 bg-violet-50 text-violet-900" },
  interview: { label: "Job Interview Prep", subtitle: "Select a topic area", icon: Briefcase, duration: "45 Mins", subjectCount: 1, multiSubject: false, gradient: "from-amber-800 to-orange-900", accent: "bg-amber-600", ringColor: "border-amber-500 bg-amber-50 text-amber-900" },
  general: { label: "General Knowledge", subtitle: "Pick any topic", icon: Globe, duration: "No Limit", subjectCount: 1, multiSubject: false, gradient: "from-teal-800 to-emerald-900", accent: "bg-teal-600", ringColor: "border-teal-500 bg-teal-50 text-teal-900" },
} as const;

function MockSetupInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const rawType = searchParams.get("type") ?? "jamb";
  const examType = (rawType in EXAM_CONFIG ? rawType : "jamb") as keyof typeof EXAM_CONFIG;
  const config = EXAM_CONFIG[examType];
  const Icon = config.icon;

  const [subjects, setSubjects] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      const token = localStorage.getItem('auth_token');
      try {
        if (!token) return;
        const { data: subjectsArray } = await subjectService.getSubjectsPage({ page: 1, limit: 50 });
        
        const formatted = subjectsArray.map((s: any) => ({
            id: s.id || s._id,
            name: s.name
        }));
        setSubjects(formatted);

        if (examType === "jamb") {
          const eng = formatted.find((s: any) => s.name.toLowerCase().includes("english"));
          if (eng) setSelected([eng.id]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (!authLoading) fetchSubs();
  }, [examType, authLoading]);

  const toggleSubject = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((s) => s !== id));
    } else {
      if (config.multiSubject) {
        if (selected.length >= config.subjectCount) return;
        setSelected([...selected, id]);
      } else {
        setSelected([id]);
      }
    }
  };

  const canStart = config.multiSubject ? selected.length === config.subjectCount : selected.length === 1;

  const startExam = () => {
    if (!canStart) return;
    const query = selected.join(",");
    router.push(`/dashboard/mock/play?subs=${query}&type=${examType}`);
  };

  if (loading || authLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Link href="/dashboard/practice" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition"><ArrowLeft size={16} /> Back</Link>
      <div className={`bg-gradient-to-r ${config.gradient} rounded-3xl p-8 flex items-center gap-6`}>
        <div className="p-4 rounded-2xl bg-white/10"><Icon size={36} className="text-white" /></div>
        <div>
          <h1 className="text-3xl font-bold text-white">{config.label}</h1>
          <p className="text-white/70 mt-1">{config.subtitle}</p>
        </div>
      </div>
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-bold text-lg text-slate-800">{config.multiSubject ? "Choose Subjects" : "Choose a Subject"}</h2>
          {config.multiSubject && <span className={`text-sm font-bold ${canStart ? "text-emerald-600" : "text-slate-400"}`}>{selected.length}/{config.subjectCount} Selected</span>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {subjects.map((sub) => {
            const isSelected = selected.includes(sub.id);
            return (
              <button key={sub.id} onClick={() => toggleSubject(sub.id)} className={`p-4 rounded-xl border-2 text-left flex items-center justify-between transition-all ${isSelected ? config.ringColor + " border-current" : "border-slate-100 hover:border-slate-300 text-slate-600"}`}>
                <span className="font-bold capitalize">{sub.name}</span>
                {isSelected && <CheckCircle size={20} className="text-current flex-shrink-0" />}
              </button>
            );
          })}
        </div>
        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
           <div className="flex items-center gap-2 text-sm text-slate-500"><AlertCircle size={16} /><span>{config.duration} Limit</span></div>
           <button onClick={startExam} disabled={!canStart} className={`px-8 py-3 rounded-xl font-bold text-white transition flex items-center gap-2 ${config.accent} disabled:opacity-50`}>Start Exam <Play size={18} fill="currentColor" /></button>
        </div>
      </div>
    </div>
  );
}

export default function MockSetup() {
  return <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>}><MockSetupInner /></Suspense>;
}