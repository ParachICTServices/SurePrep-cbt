"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import {
  BookOpen, Zap, Timer, Loader2,
  GraduationCap, Briefcase, Globe, ChevronRight, Sparkles, School, Award, Coins, Settings, AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";


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
  const { userData, user } = useAuth();
  const router = useRouter();
  const userExamCategory = userData?.examCategory || "senior";
  const userCredits = userData?.credits || 0;
  
  // READ SPECIALIZATION DIRECTLY FROM FIRESTORE (bypassing AuthContext)
  const [userSpecialization, setUserSpecialization] = useState<string | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const filteredExams = ALL_EXAM_TYPES.filter(exam => 
    exam.categories.includes(userExamCategory)
  );

  const needsSpecialization = userExamCategory === 'senior' && !userSpecialization;

  useEffect(() => {
    const fetchUserDataAndSubjects = async () => {
      if (!user) return;
      
      try {
        console.log("==========================================");
        console.log("🔥 DIRECT FIRESTORE READ - Bypassing AuthContext");
        
        // Read user document directly from Firestore
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        
        if (userDocSnap.exists()) {
          const freshUserData = userDocSnap.data();
          const specialization = freshUserData.specialization || null;
          
          console.log("📊 Fresh user data from Firestore:", freshUserData);
          console.log("📚 Specialization from Firestore:", specialization);
          
          setUserSpecialization(specialization);
          
          // Now fetch and filter subjects
          const allSubjectsSnapshot = await getDocs(collection(db, "subjects"));
          const allSubjects = allSubjectsSnapshot.docs.map((docSnap) => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              name: (data.name as string) || '',
              color: (data.color as string) || 'bg-blue-100 text-blue-600',
              category: (data.category as 'sciences' | 'arts' | 'commercial' | 'general') || 'general'
            };
          });
          
          console.log("📚 Total subjects from DB:", allSubjects.length);
          
          // Filter based on specialization
          let filteredSubjects: Subject[] = [];
          
          if (!specialization || specialization === 'general') {
            filteredSubjects = allSubjects;
            console.log("⚠️ NO SPECIALIZATION - Showing all subjects");
          } else {
            filteredSubjects = allSubjects.filter(subject => {
              const matches = subject.category === specialization || subject.category === 'general';
              console.log(`  ${subject.name} (${subject.category}) - ${matches ? '✅' : '❌'}`);
              return matches;
            });
            console.log(`✅ FILTERED to ${specialization} + general`);
            console.log("📋 Showing subjects:", filteredSubjects.map(s => s.name).join(", "));
          }
          
          // Sort
          filteredSubjects.sort((a, b) => {
            if (a.category === 'general' && b.category !== 'general') return -1;
            if (a.category !== 'general' && b.category === 'general') return 1;
            return a.name.localeCompare(b.name);
          });
          
          console.log("📊 FINAL count:", filteredSubjects.length);
          console.log("==========================================");
          
          setSubjects(filteredSubjects);
        }
        
      } catch (error) {
        console.error("❌ Error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchUserDataAndSubjects();
    }
  }, [user]);

  const handleExamClick = (exam: (typeof ALL_EXAM_TYPES)[0]) => {
    if (userCredits < exam.creditCost) {
      router.push("/dashboard/buy-credits");
    } else {
      router.push(`/dashboard/start-exam?type=${exam.id}&cost=${exam.creditCost}`);
    }
  };

  const handleSubjectClick = (subjectId: string) => {
    const subjectCost = 5;
    
    if (userCredits < subjectCost) {
      router.push("/dashboard/buy-credits");
    } else {
      router.push(`/dashboard/practice/${subjectId}/start?cost=${subjectCost}`);
    }
  };

  if (loading)
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );

  const getCategoryInfo = () => {
    switch(userExamCategory) {
      case 'senior':
        return { label: 'Senior Secondary', color: 'text-emerald-600', icon: GraduationCap };
      case 'junior':
        return { label: 'Junior Secondary', color: 'text-blue-600', icon: School };
      case 'professional':
        return { label: 'Professional/Career', color: 'text-purple-600', icon: Briefcase };
      default:
        return { label: 'All Exams', color: 'text-slate-600', icon: BookOpen };
    }
  };

  const categoryInfo = getCategoryInfo();
  const CategoryIcon = categoryInfo.icon;

  const getSpecializationDisplay = () => {
    if (!userSpecialization || userSpecialization === 'general') return null;
    
    const specMap: Record<string, string> = {
      'sciences': 'Sciences',
      'arts': 'Arts',
      'commercial': 'Commercial'
    };
    
    return specMap[userSpecialization] || userSpecialization;
  };

  const specializationDisplay = getSpecializationDisplay();

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Specialization Setup Banner */}
      {needsSpecialization && (
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="bg-white/20 p-3 rounded-xl">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">Complete Your Profile Setup</h3>
              <p className="text-white/90 mb-4">
                Choose your subject specialization (Sciences, Arts, or Commercial) to see only the subjects relevant to you.
              </p>
              <Link 
                href="/dashboard/settings"
                className="inline-flex items-center gap-2 bg-white text-orange-600 px-6 py-3 rounded-xl font-bold hover:bg-orange-50 transition"
              >
                <Settings size={18} />
                Set Specialization Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Header with Credits Display */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Centre</h1>
          <div className="flex items-center gap-2 mt-2">
            <p className="text-slate-500">
              Showing exams for:
            </p>
            <span className={`flex items-center gap-1 font-bold ${categoryInfo.color}`}>
              <CategoryIcon size={16} />
              {categoryInfo.label}
            </span>
            {specializationDisplay && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-700 font-semibold">
                  {specializationDisplay} Track
                </span>
              </>
            )}
            {!specializationDisplay && userExamCategory === 'senior' && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-amber-600 font-semibold">All Subjects</span>
              </>
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-3 rounded-xl flex items-center gap-3 shadow-lg">
            <Coins size={24} className="text-emerald-200" />
            <div>
              <p className="text-xs text-emerald-200">Your Balance</p>
              <p className="text-2xl font-bold">{userCredits}</p>
            </div>
          </div>

          <Link 
            href="/dashboard/buy-credits"
            className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-bold transition flex items-center gap-2 shadow-lg"
          >
            <Zap size={18} />
            Buy Credits
          </Link>
        </div>
      </div>

      {/* Low Credits Warning */}
      {userCredits < 10 && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-3 rounded-xl">
              <Coins className="text-amber-600" size={24} />
            </div>
            <div>
              <p className="font-bold text-amber-900">Low Credit Balance</p>
              <p className="text-sm text-amber-700">You have {userCredits} credits remaining. Purchase more to continue practicing.</p>
            </div>
          </div>
          <Link 
            href="/dashboard/buy-credits"
            className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-2 rounded-lg font-bold transition"
          >
            Top Up
          </Link>
        </div>
      )}

      {/* Exam Type Simulations */}
      <section>
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Timer size={20} className="text-slate-400" />
          Full Exam Simulations
        </h2>

        {filteredExams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredExams.map((exam) => {
              const Icon = exam.icon;
              const canAfford = userCredits >= exam.creditCost;

              return (
                <div
                  key={exam.id}
                  onClick={() => handleExamClick(exam)}
                  className={`
                    relative overflow-hidden bg-gradient-to-br ${exam.gradient}
                    rounded-2xl p-6 cursor-pointer group border ${exam.borderColor}
                    transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl
                    ${!canAfford ? 'opacity-75' : ''}
                  `}
                >
                  <div
                    className={`absolute -top-8 -right-8 h-40 w-40 ${exam.glowColor} rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity`}
                  />

                  <div className="relative z-10 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-2.5 rounded-xl bg-white/10 ${exam.textColor}`}>
                        <Icon size={22} />
                      </div>

                      <div className="flex items-center gap-1 bg-white/20 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        <Coins size={12} />
                        {exam.creditCost}
                      </div>
                    </div>

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
                        {canAfford ? "Start" : "Top Up"}
                        <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
            <p className="text-slate-500">No exam simulations available for your category.</p>
          </div>
        )}
      </section>

      {/* Subject Practice */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={20} className="text-slate-400" /> Subject Practice
            <span className="text-sm text-slate-500 font-normal">(5 credits per session)</span>
          </h3>
          {specializationDisplay && (
            <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium">
              Showing {specializationDisplay} + General subjects
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.length > 0 ? (
            subjects.map((sub) => {
              const canAfford = userCredits >= 5;
              
              return (
                <button
                  key={sub.id}
                  onClick={() => handleSubjectClick(sub.id)}
                  className="group bg-white border border-slate-200 p-6 rounded-2xl hover:shadow-xl hover:border-emerald-500 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden text-left"
                >
                  <div className="flex items-start justify-between mb-4 relative z-10">
                    <div className={`p-3 rounded-xl ${sub.color || "bg-blue-100 text-blue-600"}`}>
                      <BookOpen size={24} />
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">
                        <Coins size={12} />
                        5
                      </div>
                      {sub.category === 'general' && (
                        <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-semibold">
                          General
                        </span>
                      )}
                      {sub.category !== 'general' && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-semibold capitalize">
                          {sub.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative z-10">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors capitalize">
                      {sub.name}
                    </h3>
                    <p className="text-slate-500 text-sm mt-1">
                      {canAfford ? "Click to start practice session" : "Insufficient credits - top up to continue"}
                    </p>
                    <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-end">
                      <span className={`${canAfford ? 'text-emerald-600' : 'text-amber-600'} font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        {canAfford ? "Start" : "Buy Credits"} <Zap size={14} />
                      </span>
                    </div>
                  </div>
                </button>
              );
            })
          ) : (
            <div className="col-span-3 text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">
              <p>No subjects found for your specialization.</p>
              <p className="text-sm mt-1">Please contact admin or change your specialization in settings.</p>
            </div>
          )}
        </div>
      </section>

      {/* Settings Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
        <p className="text-slate-600 mb-3">
          Need to change your specialization or exam category?
        </p>
        <Link 
          href="/dashboard/settings" 
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
        >
          <Settings size={18} />
          Update Settings
        </Link>
      </div>
    </div>
  );
}