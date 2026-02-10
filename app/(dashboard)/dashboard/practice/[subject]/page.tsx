"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { Loader2, Timer, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatFirebaseDate } from "@/app/lib/dateUtils";

// Define Types
interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
}

export default function ExamInterface() {
  const { subject } = useParams(); // Get 'english' or 'maths' from URL
  const { user } = useAuth();
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{[key: number]: number}>({}); 
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes in seconds

  // 1. Fetch Questions on Load
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const q = query(collection(db, "questions"), where("subject", "==", subject));
        const snapshot = await getDocs(q);
        const fetchedData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Question));
        setQuestions(fetchedData);
      } catch (error) {
        console.error("Error fetching questions:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subject) fetchQuestions();
  }, [subject]);

  // 2. Timer Logic
  useEffect(() => {
    if (submitted || loading) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(); // Auto submit
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [submitted, loading]);

  // 3. Handle Option Select
  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    setSelectedOptions(prev => ({
      ...prev,
      [currentQIndex]: optionIndex
    }));
  };

  // 4. Submit & Grade (Updated with Firebase Save)
  const handleSubmit = async () => {
    
    let newScore = 0;
    questions.forEach((q, index) => {
      if (selectedOptions[index] === q.correctOption) {
        newScore += 1;
      }
    });
    
    
    setScore(newScore);
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (user) {
      try {
        await addDoc(collection(db, "testResults"), {
          userId: user.uid,
          subject: subject,
          score: newScore,
          totalQuestions: questions.length,
          percentage: Math.round((newScore / questions.length) * 100),
          date: serverTimestamp(),
          
          // 👇 NEW: Save the exam snapshot for review
          history: questions.map((q, index) => ({
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            selectedOption: selectedOptions[index] ?? -1, // -1 if skipped
            explanation: q.explanation || "No explanation provided."
          }))
        });
        console.log("Score and details saved successfully");
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }
  };

  // Formatting Time (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <div className="h-96 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;

  if (questions.length === 0) return (
    <div className="text-center mt-20">
      <h2 className="text-2xl font-bold">No questions found for {subject}</h2>
      <p className="text-slate-500 mb-6">Use the Admin Seeder button to add questions first.</p>
      <Link href="/dashboard/practice" className="text-emerald-600 hover:underline">Go Back</Link>
    </div>
  );

  // --- RESULT VIEW (After Submission) ---
  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 pt-10">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
          <div className="mb-6 flex justify-center">
            {percentage >= 50 ? (
                <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                  <CheckCircle size={48} />
                </div>
            ) : (
                <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center text-red-600">
                   <AlertCircle size={48} />
                </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {percentage >= 50 ? "Excellent Work!" : "Keep Practicing!"}
          </h2>
          <p className="text-slate-500 mb-6">
            You scored <span className="text-slate-900 font-bold text-xl">{score}</span> out of {questions.length} ({percentage}%)
          </p>

          <div className="grid grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/practice" className="py-3 px-6 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition">
              Try Another Subject
            </Link>
            <button onClick={() => window.location.reload()} className="py-3 px-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition">
              Retake Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- EXAM VIEW ---
  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header: Timer & Progress */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 sticky top-4 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Question</span>
          <span className="text-xl font-bold text-slate-900">{currentQIndex + 1}<span className="text-slate-400 text-sm">/{questions.length}</span></span>
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
          <Timer size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <h2 className="text-xl md:text-2xl font-medium text-slate-900 mb-8 leading-relaxed">
          {currentQ.questionText}
        </h2>

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                ${selectedOptions[currentQIndex] === idx 
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-900' 
                  : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                }
              `}
            >
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border
                 ${selectedOptions[currentQIndex] === idx ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-300'}
              `}>
                {String.fromCharCode(65 + idx)}
              </span>
              {option}
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQIndex === 0}
          className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        {currentQIndex === questions.length - 1 ? (
          <button 
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition"
          >
            Submit Exam
          </button>
        ) : (
          <button 
            onClick={() => setCurrentQIndex(prev => Math.min(questions.length - 1, prev + 1))}
            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}