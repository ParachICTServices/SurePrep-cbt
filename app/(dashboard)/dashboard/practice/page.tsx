"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/app/lib/firebase"; // Fixed import path
import { useAuth } from "@/app/context/AuthContext"; // Fixed import path
import { 
  BookOpen, Lock, Zap, Timer, Crown, Loader2, Play
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function PracticeSelection() {
  const { userData } = useAuth();
  const router = useRouter();
  const isPremium = userData?.subscriptionStatus === 'premium';
  
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // FETCH SUBJECTS FROM DATABASE
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "subjects"));
        const fetchedSubjects = querySnapshot.docs.map(doc => doc.data());
        setSubjects(fetchedSubjects);
      } catch (error) {
        console.error("Error loading subjects:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  const handleMockClick = () => {
    // 1. If Premium, go to Mock Setup
    if (isPremium) {
      router.push("/dashboard/mock");
    } 
    // 2. If Free, go to Upgrade Page
    else {
      router.push("/dashboard/upgrade");
    }
  };

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600"/></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Centre</h1>
          <p className="text-slate-500 mt-2">Select an exam type to start.</p>
        </div>
        {!isPremium && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2 rounded-full flex items-center gap-2">
            <Lock size={14} />
            <span>Free Mode: Limited Access</span>
          </div>
        )}
      </div>

      {/* 🌟 NEW: Full JAMB Simulation Card (Clickable) */}
      <div 
        onClick={handleMockClick}
        className="relative overflow-hidden bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-8 cursor-pointer group shadow-xl transition-all hover:scale-[1.01] border border-slate-700"
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded uppercase tracking-wide">
                Premium Feature
              </span>
              <span className="text-slate-300 text-sm flex items-center gap-1">
                <Timer size={14} /> 2 Hours (Standard)
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">Simulate Full JAMB Exam</h2>
            <p className="text-slate-300 max-w-xl">
              Take 4 subjects at once under real timed conditions. 
              The ultimate test of your speed and accuracy.
            </p>
          </div>
          
          <button className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold flex items-center gap-2 group-hover:bg-emerald-400 transition-colors">
            {isPremium ? "Start Mock Exam" : "Unlock Mock Exam"}
            {isPremium ? <Play size={18} fill="currentColor"/> : <Lock size={18} />}
          </button>
        </div>

        {/* Decorative Background */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 bg-emerald-500 rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity"></div>
      </div>

      {/* Subject Grid Header */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <BookOpen size={20} className="text-slate-400"/> Subject Practice
        </h3>

        {/* Subject Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.length > 0 ? subjects.map((sub) => (
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
                  <p className="text-slate-500 text-sm mt-1">
                    Click to start practice session.
                  </p>
                  <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-end">
                    <span className="text-emerald-600 font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Start <Zap size={14} />
                    </span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-3 text-center py-10 text-slate-500 bg-slate-50 rounded-2xl border-dashed border-2 border-slate-200">
                <p>No exams found in the database.</p>
                <p className="text-sm mt-1">Please use the Admin Portal to add subjects.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}