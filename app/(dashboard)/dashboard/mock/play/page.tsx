"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, Timer, AlertTriangle, Calculator, X } from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { MathText } from "@/app/components/MathText";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

function MockExamContent() {
  const searchParams = useSearchParams();
  const subsParam = searchParams.get("subs"); 
  const examType = searchParams.get("type") || "mock";
  const { user } = useAuth();
  const router = useRouter();

  const [subjects, setSubjects] = useState<string[]>([]);
  const [subjectNames, setSubjectNames] = useState<Record<string, string>>({});
  const [allQuestions, setAllQuestions] = useState<Record<string, any[]>>({});
  const [activeSubject, setActiveSubject] = useState<string>("");
  const [loading, setLoading] = useState(true);
  
  const [answers, setAnswers] = useState<Record<string, Record<number, number>>>({}); 
  const [timeLeft, setTimeLeft] = useState(120 * 60);
  const [submitted, setSubmitted] = useState(false);

  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDisplay, setCalcDisplay] = useState("0");
  const [calcPrevValue, setCalcPrevValue] = useState<number | null>(null);
  const [calcOperation, setCalcOperation] = useState<string | null>(null);
  const [calcNewNumber, setCalcNewNumber] = useState(true);

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  useEffect(() => {
    if (!subsParam) return;
    const subList = subsParam.split(",");
    setSubjects(subList);
    setActiveSubject(subList[0]);

    const fetchAllData = async () => {
      const token = localStorage.getItem('auth_token');
      const questionsMap: Record<string, any[]> = {};
      const namesMap: Record<string, string> = {};
      
      try {
        await Promise.all(subList.map(async (subId) => {
          const subRes = await fetch(`${API_BASE_URL}/subjects/${subId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const subData = await subRes.json();
          namesMap[subId] = subData.name || subId;

          const qRes = await fetch(`${API_BASE_URL}/questions?subjectId=${subId}&limit=40`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const qData = await qRes.json();
          const rawQuestions = Array.isArray(qData) ? qData : (qData.data || qData.results || []);
          
          questionsMap[subId] = shuffleArray(rawQuestions.map((q: any) => ({
            id: q.id || q._id,
            ...q
          })));
          
          setAnswers(prev => ({ ...prev, [subId]: {} }));
        }));

        setSubjectNames(namesMap);
        setAllQuestions(questionsMap);
      } catch (err) {
        console.error("Mock fetch error:", err);
        toast.error("Failed to load mock questions. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [subsParam]);

  // Timer
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

  const handleSelect = (qIdx: number, optIdx: number) => {
    setAnswers(prev => ({
      ...prev,
      [activeSubject]: { ...prev[activeSubject], [qIdx]: optIdx }
    }));
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('auth_token');
    setSubmitted(true);
    let totalScore = 0;
    let totalQuestions = 0;

    subjects.forEach(sub => {
      const subQs = allQuestions[sub] || [];
      const subAns = answers[sub] || {};
      subQs.forEach((q, idx) => {
        if (subAns[idx] === q.correctOption) totalScore++;
      });
      totalQuestions += subQs.length;
    });

    try {
      await fetch(`${API_BASE_URL}/test-results`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject: `${examType.toUpperCase()} Mock Simulation`,
          subjectsIncluded: subjects,
          score: totalScore,
          totalQuestions,
          percentage: Math.round((totalScore / totalQuestions) * 100) || 0,
          type: "mock",
          examType: examType
        })
      });
      
      toast.success(`Mock Submitted! Score: ${totalScore}/${totalQuestions}`);
      router.push("/dashboard");
    } catch (e) {
      console.error("Error saving mock", e);
      toast.error("Results saved locally, but failed to sync with server.");
      router.push("/dashboard");
    }
  };

  const handleCalcNumber = (num: string) => { if (calcNewNumber) { setCalcDisplay(num); setCalcNewNumber(false); } else { setCalcDisplay(calcDisplay === "0" ? num : calcDisplay + num); } };
  const handleCalcOperation = (op: string) => { const currentValue = parseFloat(calcDisplay); if (calcPrevValue !== null && calcOperation && !calcNewNumber) { const result = calculateResult(calcPrevValue, currentValue, calcOperation); setCalcDisplay(String(result)); setCalcPrevValue(result); } else { setCalcPrevValue(currentValue); } setCalcOperation(op); setCalcNewNumber(true); };
  const handleCalcEquals = () => { if (calcPrevValue !== null && calcOperation) { const currentValue = parseFloat(calcDisplay); const result = calculateResult(calcPrevValue, currentValue, calcOperation); setCalcDisplay(String(result)); setCalcPrevValue(null); setCalcOperation(null); setCalcNewNumber(true); } };
  const calculateResult = (prev: number, current: number, op: string): number => { switch (op) { case "+": return prev + current; case "-": return prev - current; case "×": return prev * current; case "÷": return current !== 0 ? prev / current : 0; default: return current; } };
  const handleCalcClear = () => { setCalcDisplay("0"); setCalcPrevValue(null); setCalcOperation(null); setCalcNewNumber(true); };
  const handleCalcDecimal = () => { if (!calcDisplay.includes(".")) { setCalcDisplay(calcDisplay + "."); setCalcNewNumber(false); } };
  const handleCalcBackspace = () => { if (calcDisplay.length > 1) { setCalcDisplay(calcDisplay.slice(0, -1)); } else { setCalcDisplay("0"); setCalcNewNumber(true); } };

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
            {subjects.map(subId => (
              <button
                key={subId}
                onClick={() => setActiveSubject(subId)}
                className={`px-4 py-2 rounded-lg font-bold text-sm capitalize whitespace-nowrap transition
                  ${activeSubject === subId 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                  }
                `}
              >
                {subjectNames[subId] || subId}
                <span className="ml-2 bg-white/20 px-1.5 py-0.5 rounded text-xs">
                  {Object.keys(answers[subId] || {}).length}/{allQuestions[subId]?.length || 0}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowCalculator(!showCalculator)} className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"><Calculator size={20} /></button>
            <div className={`flex items-center gap-2 px-6 py-2 rounded-xl font-mono font-bold text-xl ${timeLeft < 300 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-emerald-50 text-emerald-700'}`}>
              <Timer size={24} /> {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      {/* CALCULATOR WIDGET (Unchanged) */}
      <AnimatePresence>
        {showCalculator && (
          <motion.div initial={{ opacity: 0, scale: 0.9, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: -20 }} className="fixed top-20 right-4 z-30 bg-white rounded-2xl shadow-2xl border-2 border-slate-200 p-4 w-80">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-slate-700 flex items-center gap-2"><Calculator size={18} /> Calculator</h3><button onClick={() => setShowCalculator(false)} className="p-1 hover:bg-slate-100 rounded-lg"><X size={18} /></button></div>
            <div className="bg-slate-900 text-white text-right text-2xl font-mono p-4 rounded-lg mb-3 overflow-x-auto">{calcDisplay}</div>
            <div className="grid grid-cols-4 gap-2">
              <button onClick={handleCalcClear} className="col-span-2 bg-red-500 text-white font-bold py-3 rounded-lg">C</button>
              <button onClick={handleCalcBackspace} className="bg-slate-200 font-bold py-3 rounded-lg">←</button>
              <button onClick={() => handleCalcOperation("÷")} className="bg-emerald-500 text-white font-bold py-3 rounded-lg">÷</button>
              {[7,8,9].map(n => <button key={n} onClick={() => handleCalcNumber(String(n))} className="bg-slate-100 font-bold py-3 rounded-lg">{n}</button>)}
              <button onClick={() => handleCalcOperation("×")} className="bg-emerald-500 text-white font-bold py-3 rounded-lg">×</button>
              {[4,5,6].map(n => <button key={n} onClick={() => handleCalcNumber(String(n))} className="bg-slate-100 font-bold py-3 rounded-lg">{n}</button>)}
              <button onClick={() => handleCalcOperation("-")} className="bg-emerald-500 text-white font-bold py-3 rounded-lg">-</button>
              {[1,2,3].map(n => <button key={n} onClick={() => handleCalcNumber(String(n))} className="bg-slate-100 font-bold py-3 rounded-lg">{n}</button>)}
              <button onClick={() => handleCalcOperation("+")} className="bg-emerald-500 text-white font-bold py-3 rounded-lg">+</button>
              <button onClick={() => handleCalcNumber("0")} className="col-span-2 bg-slate-100 font-bold py-3 rounded-lg">0</button>
              <button onClick={handleCalcDecimal} className="bg-slate-100 font-bold py-3 rounded-lg">.</button>
              <button onClick={handleCalcEquals} className="bg-blue-500 text-white font-bold py-3 rounded-lg">=</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QUESTION AREA */}
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm min-h-[60vh]">
        <h2 className="text-xl font-bold text-slate-400 mb-6 uppercase tracking-widest">{subjectNames[activeSubject] || activeSubject} Section</h2>

        {currentQuestions.length === 0 ? (
          <div className="text-center py-20 text-slate-400 flex flex-col items-center">
            <AlertTriangle size={48} className="mb-4 text-amber-500"/>
            <p>No questions found for this subject.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {currentQuestions.map((q, qIdx) => (
              <div key={q.id} className="border-b border-slate-100 pb-8 last:border-0">
                <div className="flex gap-4 mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-slate-100 text-slate-500 font-bold rounded-full flex items-center justify-center text-sm">{qIdx + 1}</span>
                  <div className="text-lg font-medium text-slate-900 pt-1">
                    <MathText text={q.questionText} />
                  </div>
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
                         <MathText text={opt} />
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
        <button onClick={handleSubmit} className="px-10 py-4 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 transition">Submit All Papers</button>
      </div>
    </div>
  );
}

export default function MockExamPage() {
  return (
    <React.Suspense fallback={<div className="p-10 text-center">Loading Exam Environment...</div>}>
      <MockExamContent />
    </React.Suspense>
  );
}