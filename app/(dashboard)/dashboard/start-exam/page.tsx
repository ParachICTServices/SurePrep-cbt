"use client";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, Zap, ShieldCheck, AlertCircle, ArrowLeft, Coins, GraduationCap, BookOpen, Sparkles, School, Award, Briefcase, Globe } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function StartExamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const { user, loading: authLoading, refreshUser } = useAuth();
  
  const subjectId = searchParams.get("subjectId");
  const examType = searchParams.get("type");
  const cost = parseInt(searchParams.get("cost") || "0", 10);
  
  const [isDeducting, setIsDeducting] = useState(false);

  const examDetails: Record<string, { 
    name: string; 
    description: string; 
    icon: any;
    gradient: string;
    subjects?: string;
    duration: string;
  }> = {
    'jamb': {
      name: 'JAMB Mock Simulation',
      description: 'Full 4-subject JAMB UTME examination under timed conditions',
      icon: GraduationCap,
      gradient: 'from-slate-900 to-slate-800',
      subjects: '4 Subjects',
      duration: '2 Hours'
    },
    'waec': {
      name: 'WAEC Practice Exam',
      description: 'Senior Secondary Certificate Examination practice with detailed solutions',
      icon: BookOpen,
      gradient: 'from-blue-900 to-blue-800',
      subjects: 'Multiple Subjects',
      duration: '3 Hours'
    },
    'neco': {
      name: 'NECO Practice Exam',
      description: 'National Examination Council practice with past questions',
      icon: Sparkles,
      gradient: 'from-violet-900 to-violet-800',
      subjects: 'Multiple Subjects',
      duration: '2.5 Hours'
    },
    'bece': {
      name: 'BECE / Junior WAEC',
      description: 'Basic Education Certificate Examination for JSS3 students',
      icon: Award,
      gradient: 'from-indigo-900 to-indigo-800',
      subjects: 'Core Subjects',
      duration: '2 Hours'
    },
    'common-entrance': {
      name: 'Common Entrance Exam',
      description: 'Secondary school entrance examination preparation',
      icon: School,
      gradient: 'from-cyan-900 to-cyan-800',
      subjects: 'Core Subjects',
      duration: '90 Minutes'
    },
    'interview': {
      name: 'Job Interview Aptitude Test',
      description: 'Verbal reasoning, numerical aptitude, and critical thinking practice',
      icon: Briefcase,
      gradient: 'from-amber-800 to-orange-900',
      subjects: 'Aptitude & Reasoning',
      duration: '45 Minutes'
    },
    'general': {
      name: 'General Knowledge Quiz',
      description: 'Broad knowledge questions spanning multiple topics',
      icon: Globe,
      gradient: 'from-teal-800 to-emerald-900',
      subjects: 'All Topics',
      duration: 'Flexible'
    }
  };

  const currentExam = examDetails[examType || ""] || {
    name: "Mock Exam",
    description: "Practice examination",
    icon: BookOpen,
    gradient: 'from-slate-900 to-slate-800',
    duration: 'Timed'
  };

  const ExamIcon = currentExam.icon;

  const handleConfirmStart = async () => {
    if (!user || !subjectId || !examType) return;

    if (user.credits < cost) {
      router.push("/dashboard/buy-credits");
      return;
    }

    if (!API_BASE_URL) {
      alert("Application is not configured (missing API URL).");
      return;
    }

    try {
      setIsDeducting(true);
      const token = localStorage.getItem("auth_token");

      const usageRes = await fetch(`${API_BASE_URL}/credits/start-exam`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subjectId }),
      });

      if (!usageRes.ok) {
        const errBody = await usageRes.json().catch(() => ({}));
        const msg =
          typeof errBody?.message === "string"
            ? errBody.message
            : "Could not start exam. Check your credits and try again.";
        throw new Error(msg);
      }

      await refreshUser();

      router.push(`/dashboard/mock?type=${encodeURIComponent(examType)}`);
    } catch (error) {
      console.error("Failed to start exam:", error);
      alert(error instanceof Error ? error.message : "Error processing request. Please try again.");
      setIsDeducting(false);
    }
  };

  if (authLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  if (!subjectId || !examType) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <div className="text-center py-20">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid exam link</h2>
          <p className="text-slate-600 mb-6 text-sm max-w-md mx-auto">
            Start an exam from the Practice Centre so a subject is selected for billing.
          </p>
          <Link href="/dashboard/practice" className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl">
            Back to Practice Centre
          </Link>
        </div>
      </div>
    );
  }

  const currentCredits = user?.credits || 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link href="/dashboard/practice" className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 transition">
        <ArrowLeft size={20} /> Back to Practice Centre
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className={`bg-gradient-to-br ${currentExam.gradient} p-8 text-white text-center relative overflow-hidden`}>
          <div className="absolute -top-10 -right-10 h-40 w-40 bg-white/10 rounded-full blur-3xl"></div>
          
          <div className="relative z-10">
            <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg backdrop-blur-sm">
              <ExamIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold mb-2">{currentExam.name}</h1>
            <p className="text-white/80 max-w-md mx-auto">{currentExam.description}</p>
            
            <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-white/20">
              {currentExam.subjects && (
                <div className="text-center">
                  <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Coverage</p>
                  <p className="font-bold">{currentExam.subjects}</p>
                </div>
              )}
              <div className="text-center">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Duration</p>
                <p className="font-bold">{currentExam.duration}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-white/60 uppercase tracking-wider mb-1">Format</p>
                <p className="font-bold">Timed Mock</p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-slate-600">
                <span>Current Balance</span>
                <span className="font-bold flex items-center gap-1">
                  <Coins size={16} /> {currentCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Exam Cost</span>
                <span className="font-bold flex items-center gap-1">
                  - <Coins size={16} /> {cost}
                </span>
              </div>
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center text-slate-900 font-bold text-lg">
                <span>Remaining Balance</span>
                <span className="text-emerald-600 flex items-center gap-1">
                  <Coins size={20} /> {(currentCredits - cost).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
              <h3 className="font-bold text-blue-900 mb-3 flex items-center gap-2">
                <ShieldCheck size={18} />
                Exam Instructions
              </h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>This is a timed examination. Make sure you have a stable internet connection.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>You can navigate between questions but cannot pause the timer.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span>Detailed solutions will be provided after submission.</span>
                </li>
              </ul>
            </div>

            <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
              <AlertCircle className="flex-shrink-0 mt-0.5" size={20} />
              <p>Credits are non-refundable once you click "Start Exam". Ensure you are ready.</p>
            </div>

            <button
              onClick={handleConfirmStart}
              disabled={isDeducting || currentCredits < cost}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isDeducting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck size={22} />
                  Confirm & Start Exam
                </>
              )}
            </button>
            
            {currentCredits < cost && (
              <div className="text-center">
                <p className="text-red-500 font-medium text-sm mb-3">Insufficient credits.</p>
                <Link href="/dashboard/buy-credits" className="inline-flex items-center gap-2 px-6 py-2 bg-amber-500 text-white font-bold rounded-lg hover:bg-amber-600 transition">
                  <Zap size={18} /> Buy Credits
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}