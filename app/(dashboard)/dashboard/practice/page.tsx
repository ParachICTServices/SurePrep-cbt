"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import {
  BookOpen, Zap, Timer, Loader2,
  GraduationCap, Briefcase, Globe, ChevronRight, Sparkles, School, Award, Coins, Settings, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cbt.excelpracticehub.com"
).replace(/\/$/, "");

/** Subject id sent in POST /credits/start-exam when starting a full exam simulation. */
function resolveSubjectIdForExam(examId: string, subjects: Subject[]): string | null {
  if (!subjects.length) return null;
  if (examId === "general") {
    const byCategory = subjects.find((s) => s.category === "general");
    if (byCategory) return byCategory.id;
    const byName = subjects.find((s) => /general/i.test(s.name));
    return byName?.id ?? null;
  }
  if (examId === "jamb") {
    const eng = subjects.find((s) => /english/i.test(s.name));
    if (eng) return eng.id;
  }
  return subjects[0]?.id ?? null;
}

interface Subject {
  id: string;
  name: string;
  color: string;
  category: 'sciences' | 'arts' | 'commercial' | 'general';
}

const ALL_EXAM_TYPES = [
  {
    id: "jamb",
    label: "JAMB / UTME",
    badge: "University Entry",
    description: "4 subjects under real timed conditions. The ultimate test of speed and accuracy.",
    duration: "2 Hours",
    questions: "180 Questions",
    creditCost: 20,
    gradient: "from-slate-900 to-slate-800",
    icon: GraduationCap,
    glowColor: "bg-emerald-500",
    borderColor: "border-slate-700",
    textColor: "text-white",
    subTextColor: "text-slate-300",
    categories: ["senior"]
  },
  {
    id: "waec",
    label: "WAEC / SSCE",
    badge: "Senior Secondary",
    description: "Practice WAEC-style questions per subject with structured theory and objectives.",
    duration: "3 Hours",
    questions: "50 Questions",
    creditCost: 15,
    gradient: "from-blue-900 to-blue-800",
    icon: BookOpen,
    glowColor: "bg-sky-500",
    borderColor: "border-blue-700",
    textColor: "text-white",
    subTextColor: "text-blue-200",
    categories: ["senior"]
  },
  {
    id: "neco",
    label: "NECO",
    badge: "National Exams",
    description: "Targeted NECO past questions with detailed explanations for each answer.",
    duration: "2.5 Hours",
    questions: "60 Questions",
    creditCost: 15,
    gradient: "from-violet-900 to-violet-800",
    icon: Sparkles,
    glowColor: "bg-violet-400",
    borderColor: "border-violet-700",
    textColor: "text-white",
    subTextColor: "text-violet-200",
    categories: ["senior"]
  },
  {
    id: "common-entrance",
    label: "Common Entrance",
    badge: "Secondary School Entry",
    description: "Prepare for common entrance exams with comprehensive practice questions.",
    duration: "90 Mins",
    questions: "100 Questions",
    creditCost: 10,
    gradient: "from-cyan-900 to-cyan-800",
    icon: School,
    glowColor: "bg-cyan-400",
    borderColor: "border-cyan-700",
    textColor: "text-white",
    subTextColor: "text-cyan-200",
    categories: ["junior"]
  },
  {
    id: "bece",
    label: "BECE / Junior WAEC",
    badge: "Basic Education",
    description: "Basic Education Certificate Examination practice for JSS3 students.",
    duration: "2 Hours",
    questions: "60 Questions",
    creditCost: 10,
    gradient: "from-indigo-900 to-indigo-800",
    icon: Award,
    glowColor: "bg-indigo-400",
    borderColor: "border-indigo-700",
    textColor: "text-white",
    subTextColor: "text-indigo-200",
    categories: ["junior"]
  },
  {
    id: "interview",
    label: "Job Interview Prep",
    badge: "Career Development",
    description: "Sharpen your verbal reasoning, aptitude, and critical thinking for job tests.",
    duration: "45 Mins",
    questions: "40 Questions",
    creditCost: 8,
    gradient: "from-amber-800 to-orange-900",
    icon: Briefcase,
    glowColor: "bg-amber-400",
    borderColor: "border-amber-700",
    textColor: "text-white",
    subTextColor: "text-amber-200",
    categories: ["professional"]
  },
  {
    id: "general",
    label: "General Knowledge",
    badge: "Open Practice",
    description: "Broad knowledge questions spanning science, history, current affairs, and more.",
    duration: "No Limit",
    questions: "Unlimited",
    creditCost: 5,
    gradient: "from-teal-800 to-emerald-900",
    icon: Globe,
    glowColor: "bg-teal-400",
    borderColor: "border-teal-700",
    textColor: "text-white",
    subTextColor: "text-teal-200",
    categories: ["professional", "senior", "junior"]
  },
];

export default function PracticeSelection() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const userExamCategory = user?.examCategory || "senior";
  const userCredits = user?.credits || 0;
  const userSpecialization = user?.specialization || 'general';

  const filteredExams = ALL_EXAM_TYPES.filter(exam => 
    exam.categories.includes(userExamCategory)
  );

  const needsSpecialization = userExamCategory === 'senior' && (!userSpecialization || userSpecialization === 'general');

  useEffect(() => {
   const fetchSubjects = async () => {
  const token = localStorage.getItem('auth_token');
  if (!token) return;
  
  try {
    const response = await fetch(`${API_BASE_URL}/subjects`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    const rawData = await response.json();

    let subjectsArray = [];
    
    if (Array.isArray(rawData)) {
      subjectsArray = rawData;
    } else if (rawData.results && Array.isArray(rawData.results)) {
      subjectsArray = rawData.results;
    } else if (rawData.data && Array.isArray(rawData.data)) {
      subjectsArray = rawData.data;
    } else if (rawData.subjects && Array.isArray(rawData.subjects)) {
      subjectsArray = rawData.subjects;
    }

    const allSubjects: Subject[] = subjectsArray.map((s: any) => ({
        id: s.id || s._id,
        name: s.name || "Unnamed Subject",
        category: s.category || 'general',
        color: s.color || 'bg-blue-100 text-blue-600'
    }));

    allSubjects.sort((a, b) => {
      if (a.category === 'general' && b.category !== 'general') return -1;
      if (a.category !== 'general' && b.category === 'general') return 1;
      return a.name.localeCompare(b.name);
    });

    setSubjects(allSubjects);
    
  } catch (error) {
    console.error("❌ Error fetching subjects:", error);
  } finally {
    setLoading(false);
  }
};
    
    if (!authLoading && user) {
      fetchSubjects();
    }
  }, [user, authLoading, userSpecialization]);

  const handleExamClick = (exam: (typeof ALL_EXAM_TYPES)[0]) => {
    if (userCredits < exam.creditCost) {
      router.push("/dashboard/buy-credits");
      return;
    }
    const subjectId = resolveSubjectIdForExam(exam.id, subjects);
    if (!subjectId) {
      toast.error("No subject is available to link this exam. Try again after subjects load.");
      return;
    }
    const q = new URLSearchParams({
      subjectId,
      cost: String(exam.creditCost),
      type: exam.id,
    });
    router.push(`/dashboard/start-exam?${q.toString()}`);
  };

  const handleSubjectClick = (subjectId: string) => {
    const subjectCost = 5;
    if (userCredits < subjectCost) {
      router.push("/dashboard/buy-credits");
    } else {
       router.push(`/dashboard/practice/${subjectId}/topics`);
    }
  };

  if (authLoading || loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  const getCategoryInfo = () => {
    switch(userExamCategory) {
      case 'senior': return { label: 'Senior Secondary', color: 'text-emerald-600', icon: GraduationCap };
      case 'junior': return { label: 'Junior Secondary', color: 'text-blue-600', icon: School };
      case 'professional': return { label: 'Professional/Career', color: 'text-purple-600', icon: Briefcase };
      default: return { label: 'All Exams', color: 'text-slate-600', icon: BookOpen };
    }
  };

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Specialization Banner */}
      {needsSpecialization && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl"><AlertCircle size={24} /></div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Complete Your Profile Setup</h3>
              <p className="text-white/90 mb-4">Choose your specialization to see relevant subjects.</p>
              <Link href="/dashboard/settings" className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition">
                <Settings size={18} /> Set Specialization Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Centre</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`flex items-center gap-1 font-bold ${categoryInfo.color}`}>
              <CategoryIcon size={16} /> {categoryInfo.label}
            </span>
            {userSpecialization !== 'general' && (
              <span className="text-slate-700 font-semibold capitalize">
                • {userSpecialization} Track
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 shadow-lg">
            <Coins size={24} className="text-emerald-200" />
            <div>
              <p className="text-xs text-emerald-200">Balance</p>
              <p className="text-2xl font-bold">{userCredits}</p>
            </div>
          </div>
          <Link href="/dashboard/buy-credits" className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg">
            <Zap size={18} /> Buy Credits
          </Link>
        </div>
      </div>

      {/* Simulations */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Timer size={20} className="text-slate-400" /> Full Exam Simulations
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredExams.map((exam) => {
            const Icon = exam.icon;
            const canAfford = userCredits >= exam.creditCost;
            return (
              <div key={exam.id} onClick={() => handleExamClick(exam)} className={`relative overflow-hidden bg-gradient-to-br ${exam.gradient} rounded-2xl p-6 cursor-pointer group border ${exam.borderColor} transition-all hover:scale-[1.02] hover:shadow-2xl ${!canAfford ? 'opacity-75' : ''}`}>
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 rounded-xl bg-white/10 text-white"><Icon size={22} /></div>
                    <div className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full"><Coins size={12} /> {exam.creditCost}</div>
                  </div>
                  <div>
                    <span className={`text-[10px] font-bold tracking-widest uppercase ${exam.subTextColor} mb-1 block`}>{exam.badge}</span>
                    <h3 className="text-xl font-bold text-white">{exam.label}</h3>
                    <p className={`text-sm mt-1 leading-relaxed ${exam.subTextColor}`}>{exam.description}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Subjects */}
      <section>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-slate-400" /> Subject Practice
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <button key={sub.id} onClick={() => handleSubjectClick(sub.id)} className="group bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-emerald-500 transition-all text-left">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${sub.color}`}><BookOpen size={24} /></div>
                <div className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full"><Coins size={12} /> 5</div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 capitalize">{sub.name}</h3>
              <p className="text-slate-500 text-sm mt-1">{sub.category === 'general' ? 'Core Subject' : `${sub.category} elective`}</p>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}