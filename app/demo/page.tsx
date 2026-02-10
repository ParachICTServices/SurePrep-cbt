"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { CheckCircle, Timer, XCircle, AlertCircle, Zap, ChevronRight, Lock } from "lucide-react";

// 🌟 UPDATED: 6 Questions covering major JAMB subjects
const demoQuestions = [
  {
    id: 1,
    subject: "Use of English",
    text: "Choose the option nearest in meaning to the underlined word: 'The man is known for his *candour*.'",
    options: ["Rudeness", "Frankness", "Dishonesty", "Boldness"],
    correct: 1,
    explanation: "Candour means the quality of being open and honest."
  },
  {
    id: 2,
    subject: "Mathematics",
    text: "If 2x + 5 = 15, what is the value of x?",
    options: ["10", "2.5", "5", "7.5"],
    correct: 2,
    explanation: "Subtract 5 from both sides: 2x = 10. Divide by 2: x = 5."
  },
  {
    id: 3,
    subject: "Chemistry",
    text: "The movement of particles from a region of higher concentration to lower concentration is called...",
    options: ["Osmosis", "Diffusion", "Transpiration", "Evaporation"],
    correct: 1,
    explanation: "Diffusion is the net movement of anything from a region of higher concentration to a region of lower concentration."
  },
  {
    id: 4,
    subject: "Physics",
    text: "The SI unit of Force is...",
    options: ["Joule", "Watt", "Newton", "Pascal"],
    correct: 2,
    explanation: "The Newton (N) is the International System of Units (SI) derived unit of force."
  },
  {
    id: 5,
    subject: "Biology",
    text: "Which of these is known as the 'powerhouse' of the cell?",
    options: ["Nucleus", "Mitochondria", "Ribosome", "Golgi body"],
    correct: 1,
    explanation: "Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions."
  },
  {
    id: 6,
    subject: "Government",
    text: "Who was the first Military Head of State in Nigeria?",
    options: ["Gen. Yakubu Gowon", "Gen. Aguiyi Ironsi", "Gen. Murtala Mohammed", "Gen. Olusegun Obasanjo"],
    correct: 1,
    explanation: "Major General Johnson Aguiyi-Ironsi was the first Military Head of State of Nigeria."
  }
];

export default function DemoPage() {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(90);

  useEffect(() => {
    if (!started || finished) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setFinished(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [started, finished]);

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    if (idx === demoQuestions[currentIndex].correct) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < demoQuestions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      
      
      <nav className="fixed w-full z-50 bg-white/80 backdrop-blur-md border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-emerald-600 tracking-tight">PARACH</Link>
          <div className="flex gap-4">
             <span className="hidden md:block text-xs font-bold bg-emerald-100 text-emerald-700 px-3 py-2 rounded-full border border-emerald-200">
               DEMO MODE
             </span>
             <Link href="/" className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-full hover:bg-slate-800 transition">
               Exit Demo
             </Link>
          </div>
        </div>
      </nav>

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        
        {!started ? (
          // 1. INTRO SCREEN
          <div className="text-center max-w-2xl mx-auto">
            <div className="h-20 w-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap size={40} className="text-emerald-600" fill="currentColor" />
            </div>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Experience the CBT Engine</h1>
            <p className="text-slate-500 text-lg mb-8">
              Take a quick <strong>6-question</strong> test covering English, Math, and Sciences. 
              Feel the speed and accuracy of the Parach platform.
            </p>
            <button 
              onClick={() => setStarted(true)}
              className="px-8 py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all transform hover:-translate-y-1"
            >
              Start Quick Demo
            </button>
            <p className="mt-4 text-xs text-slate-400">No sign-up required for demo.</p>
          </div>
        ) : !finished ? (
      
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 mb-6 sticky top-24 z-10">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-emerald-600 uppercase tracking-wider">{demoQuestions[currentIndex].subject}</span>
                <span className="text-slate-300">|</span>
                <span className="text-sm font-bold text-slate-900">Q{currentIndex + 1}/{demoQuestions.length}</span>
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 15 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
                <Timer size={18} />
                {formatTime(timeLeft)}
              </div>
            </div>

            {/* Question Card */}
            <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 mb-8 relative overflow-hidden">
               <h2 className="text-xl md:text-2xl font-medium text-slate-900 mb-8 leading-relaxed">
                 {demoQuestions[currentIndex].text}
               </h2>

               <div className="space-y-3 relative z-10">
                 {demoQuestions[currentIndex].options.map((opt, idx) => {
                  
                   let style = "border-slate-200 hover:border-emerald-300 bg-white";
                   if (isAnswered) {
                     if (idx === demoQuestions[currentIndex].correct) style = "border-emerald-500 bg-emerald-50 text-emerald-900 font-bold";
                     else if (idx === selectedOption) style = "border-red-500 bg-red-50 text-red-900";
                     else style = "opacity-50 border-slate-100";
                   }

                   return (
                     <button
                       key={idx}
                       onClick={() => handleSelect(idx)}
                       disabled={isAnswered}
                       className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${style}`}
                     >
                       <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${isAnswered && idx === demoQuestions[currentIndex].correct ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                         {String.fromCharCode(65 + idx)}
                       </span>
                       {opt}
                       {isAnswered && idx === demoQuestions[currentIndex].correct && <CheckCircle size={20} className="ml-auto text-emerald-600" />}
                       {isAnswered && idx === selectedOption && idx !== demoQuestions[currentIndex].correct && <XCircle size={20} className="ml-auto text-red-600" />}
                     </button>
                   );
                 })}
               </div>

               {/* The "Teaser" Explanation (Locked) */}
               {isAnswered && (
                 <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 relative group cursor-not-allowed">
                    <div className="flex items-center gap-2 text-slate-900 font-bold mb-2">
                       <Lock size={16} className="text-emerald-600" /> Explanation
                    </div>
                    <p className="text-slate-400 blur-sm select-none">
                       {demoQuestions[currentIndex].explanation} This is why Parach is the best platform for your success.
                    </p>
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Link href="/register" className="bg-slate-900 text-white text-xs px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
                          Sign Up to Unlock
                       </Link>
                    </div>
                 </div>
               )}
            </div>

            {/* Navigation */}
            <div className="flex justify-end">
               <button 
                 onClick={handleNext}
                 disabled={!isAnswered}
                 className="flex items-center gap-2 px-8 py-4 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700 transition"
               >
                 {currentIndex === demoQuestions.length - 1 ? "Finish Demo" : "Next Question"} <ChevronRight size={20} />
               </button>
            </div>
          </div>
        ) : (
         
          <div className="text-center animate-in zoom-in duration-300">
             <div className="bg-white p-10 rounded-3xl shadow-xl border border-emerald-100 max-w-lg mx-auto">
                <div className="mb-6">
                   {score >= 4 ? (
                      <div className="h-24 w-24 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto">
                        <CheckCircle size={48} />
                      </div>
                   ) : (
                      <div className="h-24 w-24 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto">
                        <AlertCircle size={48} />
                      </div>
                   )}
                </div>

                <h2 className="text-3xl font-bold text-slate-900 mb-2">Demo Complete!</h2>
                <p className="text-slate-500 mb-6">You scored <span className="font-bold text-emerald-600 text-xl">{score}/{demoQuestions.length}</span></p>

                {/* The "Missing Out" Stats */}
                <div className="bg-slate-50 p-6 rounded-2xl mb-8 text-left space-y-3 opacity-70">
                   <div className="flex justify-between items-center blur-[2px]">
                      <span className="text-sm text-slate-500">Speed Analysis</span>
                      <span className="text-sm font-bold text-slate-900">Top 10%</span>
                   </div>
                   <div className="flex justify-between items-center blur-[2px]">
                      <span className="text-sm text-slate-500">Topic Strength</span>
                      <span className="text-sm font-bold text-green-600">Excellent</span>
                   </div>
                   <div className="text-center text-xs font-bold text-emerald-600 uppercase tracking-wide mt-2">
                      <Lock size={12} className="inline mr-1" /> Full Analytics Locked
                   </div>
                </div>

                <Link 
                  href="/register" 
                  className="block w-full py-4 bg-emerald-600 text-white text-lg font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1"
                >
                  Create Free Account
                </Link>
                <p className="mt-4 text-sm text-slate-400">Join 1,000+ students practicing today.</p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
}