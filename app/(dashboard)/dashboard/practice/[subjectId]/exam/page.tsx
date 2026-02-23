"use client";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, getDoc, doc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { MathText } from "@/app/components/MathText"; // ← ADD THIS
import { Loader2, Timer, CheckCircle, AlertCircle, X, Image as ImageIcon, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";

interface Question {
  id: string;
  questionText: string;
  options: string[];
  correctOption: number;
  explanation?: string;
  imageURL?: string;
}

export default function ExamInterface() {
  const { subjectId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, userData } = useAuth();
  
  const topicFilter = searchParams.get('topic');
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{[key: number]: number}>({}); 
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [subjectName, setSubjectName] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);

 function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

 useEffect(() => {
  const fetchQuestions = async () => {
    try {
      console.log("Fetching questions for subject:", subjectId);
        
        const subjectDocRef = doc(db, "subjects", subjectId as string);
        const subjectDoc = await getDoc(subjectDocRef);
        
        if (subjectDoc.exists()) {
          setSubjectName(subjectDoc.data().name || subjectId as string);
          console.log("Subject name:", subjectDoc.data().name);
        } else {
          console.log("Subject not found, using ID as name");
          setSubjectName(subjectId as string);
        }
      
      console.log("=== FETCH DEBUG ===");
      console.log("Subject ID:", subjectId);
      console.log("Topic Filter:", topicFilter);
      
      let q;
      
      if (topicFilter) {
        console.log("🔎 Filtering by topic:", topicFilter);
        q = query(
          collection(db, "questions"),
          where("subject", "==", subjectId),
          where("topics", "array-contains", topicFilter)
        );
      } else {
        console.log("📚 Fetching ALL questions");
        q = query(
          collection(db, "questions"),
          where("subject", "==", subjectId)
        );
      }
      
      const snapshot = await getDocs(q);
      console.log(`✅ Fetched ${snapshot.size} questions`);
      
      snapshot.docs.slice(0, 3).forEach((doc, i) => {
        const data = doc.data();
        console.log(`Question ${i + 1}:`, {
          text: data.questionText?.substring(0, 40) + "...",
          topics: data.topics,
          hasTopicsField: 'topics' in data,
          isArray: Array.isArray(data.topics)
        });
      });
      
  const fetchedData = snapshot.docs.map(doc => ({ 
  id: doc.id, 
  ...doc.data() 
} as Question));

setQuestions(shuffleArray(fetchedData));
    } catch (error) {
      console.error("❌ Error fetching questions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (subjectId) fetchQuestions();
}, [subjectId, topicFilter]);



  // 2. Timer Logic
  useEffect(() => {
    if (submitted || loading || questions.length === 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [submitted, loading, questions.length]);

  // 3. Prevent page refresh
  useEffect(() => {
    if (submitted || loading || allowNavigation) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitted, loading, allowNavigation]);

  // 4. Prevent browser back button
  useEffect(() => {
    if (submitted || loading || allowNavigation) return;

    window.history.pushState(null, '', window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, '', window.location.href);
      setShowExitModal(true);
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [submitted, loading, allowNavigation]);

  // 5. Intercept in-app link clicks
  useEffect(() => {
    if (submitted || loading || allowNavigation) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      
      if (link && link.href && !link.href.includes('#')) {
        e.preventDefault();
        e.stopPropagation();
        setShowExitModal(true);
      }
    };

    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [submitted, loading, allowNavigation]);

  // 6. Handle Option Selection
  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    setSelectedOptions(prev => ({
      ...prev,
      [currentQIndex]: optionIndex
    }));
  };

  // 7. Handle Exit 
  const handleExitAttempt = () => {
    setShowExitModal(true);
  };

  const confirmExit = () => {
    setAllowNavigation(true);
    setTimeout(() => {
      router.push('/dashboard/practice');
    }, 100);
  };

  const cancelExit = () => {
    setShowExitModal(false);
    window.history.pushState(null, '', window.location.href);
  };

  // 8. Submit & Grade
  const handleSubmit = async () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (selectedOptions[index] === q.correctOption) {
        newScore += 1;
      }
    });
    
    setScore(newScore);
    setSubmitted(true);
    setAllowNavigation(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (user) {
      try {
        await addDoc(collection(db, "testResults"), {
          userId: user.uid,
          subject: subjectName || subjectId,
          subjectId: subjectId,
          topic: topicFilter || "all-topics",
          score: newScore,
          totalQuestions: questions.length,
          percentage: Math.round((newScore / questions.length) * 100),
          date: serverTimestamp(),
          type: 'practice',
          
          history: questions.map((q, index) => ({
            questionText: q.questionText,
            options: q.options,
            correctOption: q.correctOption,
            selectedOption: selectedOptions[index] ?? -1,
            explanation: q.explanation || "No explanation provided.",
            imageURL: q.imageURL || null 
          }))
        });
      } catch (error) {
        console.error("Error saving score:", error);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500">Loading questions...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-20 bg-white rounded-2xl p-10 border border-slate-200">
        <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">No Questions Found</h2>
        <p className="text-slate-500 mb-6">
          {topicFilter ? (
            <>
              There are no questions available for <strong>{topicFilter.replace(/-/g, ' ')}</strong> in <strong className="capitalize">{subjectName || subjectId}</strong> yet.
            </>
          ) : (
            <>
              There are no questions available for <strong className="capitalize">{subjectName || subjectId}</strong> yet.
            </>
          )}
        </p>
        <p className="text-sm text-slate-400 mb-6">
          Please contact an administrator to add questions{topicFilter ? ' for this topic' : ''}.
        </p>
        <div className="flex gap-3 justify-center">
          <Link 
            href={`/dashboard/practice/${subjectId}/topics`}
            className="inline-block px-6 py-3 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition"
          >
            ← Choose Different Topic
          </Link>
          <Link 
            href="/dashboard/practice" 
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
          >
            Practice Centre
          </Link>
        </div>
      </div>
    );
  }

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
            <Link 
              href={`/dashboard/practice/${subjectId}/topics`}
              className="py-3 px-6 rounded-xl border border-slate-200 font-medium hover:bg-slate-50 transition"
            >
              Choose Topic
            </Link>
            <Link 
              href={topicFilter 
                ? `/dashboard/practice/${subjectId}/start?topic=${topicFilter}&cost=5`
                : `/dashboard/practice/${subjectId}/start?cost=5`
              }
              className="py-3 px-6 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition"
            >
              Retake Practice
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Zoom Modal */}
      {imageZoomed && currentQ.imageURL && (
        <div 
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button
            onClick={() => setImageZoomed(false)}
            className="absolute top-4 right-4 bg-white text-slate-900 p-3 rounded-full hover:bg-slate-100 transition"
          >
            <X size={24} />
          </button>
          <img 
            src={currentQ.imageURL} 
            alt="Question diagram (zoomed)" 
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="bg-gradient-to-br from-red-600 to-red-700 p-6 rounded-t-3xl text-white text-center">
              <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold">Exit Exam?</h2>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-600 text-center leading-relaxed">
                Are you sure you want to exit this practice session?
              </p>
              
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                <div className="text-sm">
                  <p className="font-bold text-amber-900 mb-1">Credits will NOT be refunded</p>
                  <p className="text-amber-700">
                    You have already spent <strong>5 credits</strong> to start this session. 
                    Exiting now will forfeit your progress and credits.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Progress:</span>
                  <span className="font-bold text-slate-900">
                    {currentQIndex + 1} / {questions.length} questions
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Time Remaining:</span>
                  <span className="font-bold text-slate-900">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Answers Selected:</span>
                  <span className="font-bold text-slate-900">
                    {Object.keys(selectedOptions).length} / {questions.length}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={cancelExit}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition shadow-lg shadow-emerald-200"
                >
                  Continue Exam
                </button>
                <button
                  onClick={confirmExit}
                  className="px-6 py-3 bg-white border-2 border-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition"
                >
                  Exit Anyway
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exit Button - Fixed Position */}
      <button
        onClick={handleExitAttempt}
        className="fixed top-20 right-4 md:right-8 bg-white border-2 border-slate-200 hover:border-red-300 hover:bg-red-50 text-slate-600 hover:text-red-600 p-3 rounded-xl shadow-lg transition-all z-40 group"
        title="Exit Exam"
      >
        <X size={20} />
      </button>

      {/* Header: Timer & Progress */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 sticky top-4 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Question</span>
          <span className="text-xl font-bold text-slate-900">{currentQIndex + 1}<span className="text-slate-400 text-sm">/{questions.length}</span></span>
          {currentQ.imageURL && (
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
              <ImageIcon size={12} />
              Diagram
            </span>
          )}
        </div>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-700'}`}>
          <Timer size={18} />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card - ← USE MathText HERE */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <MathText 
          text={currentQ.questionText} 
          className="text-xl md:text-2xl font-medium text-slate-900 mb-6 leading-relaxed"
        />

        {/* Question Image (if exists) */}
        {currentQ.imageURL && (
          <div className="mb-8">
            <div className="relative group inline-block">
              <img 
                src={currentQ.imageURL} 
                alt="Question diagram" 
                className="max-w-full md:max-w-2xl w-full h-auto rounded-xl border-2 border-slate-200 cursor-pointer hover:border-blue-400 transition"
                onClick={() => setImageZoomed(true)}
                onError={(e) => {
                  console.error("Image failed to load:", currentQ.imageURL);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <button
                onClick={() => setImageZoomed(true)}
                className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-1 shadow-lg"
              >
                <ZoomIn size={14} />
                Click to Enlarge
              </button>
            </div>
          </div>
        )}

        {/* Options - ← USE MathText HERE */}
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
              <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0
                 ${selectedOptions[currentQIndex] === idx ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-300'}
              `}>
                {String.fromCharCode(65 + idx)}
              </span>
              <MathText text={option} className="flex-1" />
            </button>
          ))}
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
          disabled={currentQIndex === 0}
          className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
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