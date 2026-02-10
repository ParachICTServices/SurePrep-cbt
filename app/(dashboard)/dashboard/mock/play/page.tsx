"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, Timer, AlertTriangle } from "lucide-react";
import React from "react";
import { formatFirebaseDate } from "@/app/lib/dateUtils";

// Helper to wrap useSearchParams in Suspense for Next.js
function MockExamContent() {
  const searchParams = useSearchParams();
  const subsParam = searchParams.get("subs"); // "english,maths,physics,chem"
  const { user } = useAuth();
  const router = useRouter();

  // State
  const [subjects, setSubjects] = useState<string[]>([]);
  const [allQuestions, setAllQuestions] = useState<Record<string, any[]>>({});
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  // Exam State
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({}); // { subjectId: { qIndex: optionIndex } }
  const [timeLeft, setTimeLeft] = useState(120 * 60); // 2 Hours
  const [submitted, setSubmitted] = useState(false);

  // 1. Initialize & Fetch
  useEffect(() => {
    if (!subsParam) return;
    const subList = subsParam.split(",");
    setSubjects(subList);
    setActiveSubject(subList[0]);

    const fetchAll = async () => {
      const questionsMap: Record<string, any[]> = {};
      
      // Fetch questions for each subject in parallel
      await Promise.all(subList.map(async (sub) => {
        // In real JAMB, English is 60, others 40. For now, we fetch up to 40 of each.
        const q = query(collection(db, "questions"), where("subject", "==", sub), limit(40));
        const snap = await getDocs(q);
        questionsMap[sub] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        
        // Initialize answers object
        setAnswers(prev => ({ ...prev, [sub]: {} }));
      }));

      setAllQuestions(questionsMap);
      setLoading(false);
    };

    fetchAll();
  }, [subsParam]);

  // 2. Timer
  useEffect(() => {
    if (loading || submitted) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [loading, submitted]);

  // 3. Handle Answering
  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [activeSubject]: {
        ...prev[activeSubject],
        [qIdx]: optIdx
      }
    }));
  };

  // 4. Submit Mock
  const handleSubmit = async () => {
    setSubmitted(true);
    let totalScore = 0;
    let totalQuestions = 0;

    // Calculate Score across all subjects
    subjects.forEach(sub => {
      const subQs = allQuestions[sub] || [];
      const subAns = answers[sub] || {};
      
      subQs.forEach((q, idx) => {
        if (subAns[idx] === q.correctOption) totalScore++;
      });
      totalQuestions += subQs.length;
    });

    // Save to DB
    if (user) {
      try {
        await addDoc(collection(db, "testResults"), {
          userId: user.uid,
          subject: "JAMB Mock Simulation", // Special Title
          subjectsIncluded: subjects,
          score: totalScore,
          totalQuestions,
          percentage: Math.round((totalScore / totalQuestions) * 100) || 0,
          date: serverTimestamp(),
          type: "mock"
        });
        
        // Redirect to Dashboard (or a specific Mock Result page)
        alert(`Mock Submitted! Score: ${totalScore}/${totalQuestions}`);
        router.push("/dashboard");
      } catch (e) {
        console.error("Error saving mock", e);
      }
    }
  };

  // Helpers
  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={48}/></div>;

  const currentQuestions = allQuestions[activeSubject] || [];

  return (
    <div className="max-w-6xl mx-auto pb-20">
      
      {/* HEADER: Timer & Tabs */}
      <div className="bg-white sticky top-4 z-20 rounded-2xl shadow-sm border border-slate-200 p-2 mb-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-4 py-2">
          
          {/* Subject Tabs */}
          <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {subjects.map(sub => (
              <button
                key={sub}
                onClick={() => setActiveSubject(sub)}
                className={`px-4 py-2 rounded-lg font-bold text-sm capitalize whitespace-nowrap transition
                  ${activeSubject === sub 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }
                `}
              >
                {sub}
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {Object.keys(answers[sub] || {}).length}/{allQuestions[sub]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-2 px-6 py-2 rounded-xl font-mono font-bold text-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
            <Timer size={24} />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {/* QUESTION AREA */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[60vh]">
        <h2 className="text-xl font-bold text-slate-400 mb-6 uppercase tracking-widest">{activeSubject} Section</h2>

        {currentQuestions.length === 0 ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center">
            <AlertTriangle size={48} className="mb-4 text-amber-500"/>
            <p>No questions found for this subject.</p>
            <p className="text-sm">Please ask Admin to upload questions for {activeSubject}.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {currentQuestions.map((q, qIdx) => (
              <div key={q.id} className="border-b border-slate-100 pb-8 last:border-0">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 font-bold rounded-full flex items-center justify-center text-sm">
                    {qIdx + 1}
                  </span>
                  <p className="text-lg font-medium text-slate-900 pt-1">{q.questionText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-12">
                  {q.options.map((opt: string, optIdx: number) => {
                    const isSelected = answers[activeSubject]?.[qIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelect(qIdx, optIdx)}
                        className={`text-left p-3 rounded-lg border transition-all flex items-center gap-3 text-sm
                          ${isSelected 
                            ? 'bg-slate-900 text-white border-slate-900' 
                            : 'bg-white border-slate-200 text-slate-600 hover:border-emerald-400'
                          }
                        `}
                      >
                         <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${isSelected ? 'border-white' : 'border-slate-300'}`}>
                           {String.fromCharCode(65 + optIdx)}
                         </span>
                         {opt}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div className="mt-8 flex justify-end">
        <button 
          onClick={handleSubmit}
          className="px-10 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition"
        >
          Submit All Papers
        </button>
      </div>
    </div>
  );
}

// ⚠️ REQUIRED: Wrap in Suspense for Next.js Build
export default function MockExamPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-center">Loading Exam Environment...</div>}>
      <MockExamContent />
    </React.Suspense>
  );
}