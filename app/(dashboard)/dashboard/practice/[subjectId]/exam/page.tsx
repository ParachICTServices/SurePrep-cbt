"use client";
import { useEffect, useState, useCallback } from "react";
import { MathText } from "@/app/components/MathText";
import { Loader2, Timer, CheckCircle, AlertCircle, X, ZoomIn } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { subjectService } from "@/app/lib/api/services/subjectService";
import { examService } from "@/app/lib/api/services/examService";
import { contentService } from "@/app/lib/api/services/contentService";

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

  const topicFilter = searchParams.get("topic");
  const examType = searchParams.get("examType") || "jamb";
const subsParam = searchParams.get("subjectIds");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [subjectName, setSubjectName] = useState("");
  const [showExitModal, setShowExitModal] = useState(false);
  const [allowNavigation, setAllowNavigation] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [accessError, setAccessError] = useState<string | null>(null);

  function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  useEffect(() => {
    const fetchSubjectName = async () => {
      if (!subjectId) return;
      try {
        const subject = await subjectService.getSubject(String(subjectId));
        setSubjectName(subject.name || "");
      } catch (error) {
        console.error("Error fetching subject name:", error);
      }
    };
    fetchSubjectName();
  }, [subjectId]);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const rawQuestions = await contentService.getPracticeQuestions({
          examType,
          subjectId: String(subjectId),
          topicId: topicFilter,
          subject: String(subjectId),
        });
        setQuestions(
          shuffleArray(rawQuestions)
        );
      } catch (error) {
        console.error("Fetch Error:", error);
        setAccessError(
          error instanceof Error && /403|402|access|unlock|premium/i.test(error.message)
            ? "You've completed the 100 free practice questions for this subject. Unlock more questions to continue practicing."
            : "We couldn't load questions for this selection. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [subjectId, topicFilter, examType, subsParam]);

  const handleSubmit = useCallback(async () => {
    let newScore = 0;
    questions.forEach((q, index) => {
      if (selectedOptions[index] === q.correctOption) newScore += 1;
    });

    setScore(newScore);
    setSubmitted(true);
    setAllowNavigation(true);
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      await examService.submitTestResult({
        subjectId: String(subjectId),
        subject: subjectName,
        score: newScore,
        totalQuestions: questions.length,
        percentage: Math.round((newScore / questions.length) * 100),
        type: "practice",
        topic: topicFilter || "all-topics",
        date: new Date().toISOString(),
        history: questions.map((q, index) => ({
          questionId: q.id,
          questionText: q.questionText,
          options: q.options,
          correctOption: q.correctOption,
          selectedOption: selectedOptions[index] ?? -1,
          explanation: q.explanation || "No explanation provided.",
          imageURL: q.imageURL,
        })),
      });
    } catch (error) {
      console.error("Error saving test result:", error);
    }
  }, [questions, selectedOptions, subjectId, subjectName, topicFilter]);

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
  }, [submitted, loading, questions.length, handleSubmit]);

  useEffect(() => {
    if (submitted || loading || allowNavigation) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    window.history.pushState(null, "", window.location.href);
    const handlePopState = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
      setShowExitModal(true);
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [submitted, loading, allowNavigation]);

  const handleSelect = (optionIndex: number) => {
    if (submitted) return;
    setSelectedOptions((prev) => ({ ...prev, [currentQIndex]: optionIndex }));
  };

  const confirmExit = () => {
    setAllowNavigation(true);
    router.push("/dashboard/practice");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500">Loading session...</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center mt-20 bg-white rounded-2xl p-10 border border-slate-200">
        <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          {accessError ? "Free Practice Complete" : "No Questions Found"}
        </h2>
        <p className="text-slate-500 mb-6">
          {accessError || "We couldn't find any questions for this selection."}
        </p>
        {accessError && (
          <Link
            href="/dashboard/buy-credits"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl mb-3"
          >
            Unlock More Questions
          </Link>
        )}
        <br />
        <Link
          href="/dashboard/practice"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl"
        >
          Back to Practice Centre
        </Link>
      </div>
    );
  }

  if (submitted) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="max-w-2xl mx-auto text-center space-y-6 pt-10">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100">
          <div className="mb-6 flex justify-center">
            <div
              className={`h-24 w-24 rounded-full flex items-center justify-center ${
                percentage >= 50 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
              }`}
            >
              {percentage >= 50 ? <CheckCircle size={48} /> : <AlertCircle size={48} />}
            </div>
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            {percentage >= 50 ? "Excellent Work!" : "Keep Practicing!"}
          </h2>
          <p className="text-slate-500 mb-6">
            You scored <strong>{score}</strong> out of {questions.length} ({percentage}%)
          </p>
          <div className="grid grid-cols-2 gap-4">
            <Link
              href={`/dashboard/practice/${subjectId}/topics`}
              className="py-3 rounded-xl border border-slate-200 font-medium"
            >
              Change Topic
            </Link>
            <Link
              href="/dashboard/practice"
              className="py-3 rounded-xl bg-emerald-600 text-white font-bold"
            >
              Done
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQIndex];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Image Zoom */}
      {imageZoomed && currentQ.imageURL && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setImageZoomed(false)}
        >
          <button className="absolute top-4 right-4 bg-white p-3 rounded-full">
            <X size={24} />
          </button>
          <img
            src={currentQ.imageURL}
            alt="Diagram"
            className="max-w-full max-h-[90vh] object-contain"
          />
        </div>
      )}

      {/* Exit Modal */}
      {showExitModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center">
            <h2 className="text-2xl font-bold mb-4">Exit Practice?</h2>
            <p className="text-slate-600 mb-6">
              Progress will not be saved and credits are not refundable.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl"
              >
                Continue
              </button>
              <button
                onClick={confirmExit}
                className="px-6 py-3 border-2 border-slate-200 rounded-xl"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowExitModal(true)}
        className="fixed top-20 right-4 bg-white border-2 border-slate-200 p-3 rounded-xl shadow-lg z-40"
      >
        <X size={20} />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 sticky top-4 z-10">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-500">Question</span>
          <span className="text-xl font-bold text-slate-900">
            {currentQIndex + 1}
            <span className="text-slate-400 text-sm">/{questions.length}</span>
          </span>
        </div>
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono font-bold ${
            timeLeft < 60 ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"
          }`}
        >
          <Timer size={18} /> {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-6 md:p-10 rounded-3xl shadow-sm border border-slate-200 mb-8">
        <MathText
          text={currentQ.questionText}
          className="text-xl md:text-2xl font-medium text-slate-900 mb-6 leading-relaxed"
        />

        {currentQ.imageURL && (
          <div className="mb-8 relative group inline-block">
            <img
              src={currentQ.imageURL}
              alt="diagram"
              className="max-w-full h-auto rounded-xl border-2 border-slate-200 cursor-zoom-in"
              onClick={() => setImageZoomed(true)}
            />
            <div className="absolute top-2 right-2 bg-white/90 p-2 rounded-lg text-xs font-bold flex items-center gap-1 shadow-lg pointer-events-none">
              <ZoomIn size={14} /> Zoom
            </div>
          </div>
        )}

        <div className="space-y-3">
          {currentQ.options.map((option, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                selectedOptions[currentQIndex] === idx
                  ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                  : "border-slate-100 hover:border-slate-300 bg-slate-50"
              }`}
            >
              <span
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border flex-shrink-0 ${
                  selectedOptions[currentQIndex] === idx
                    ? "bg-emerald-500 text-white border-emerald-500"
                    : "bg-white text-slate-500 border-slate-300"
                }`}
              >
                {String.fromCharCode(65 + idx)}
              </span>
              <MathText text={option} className="flex-1" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between pb-10">
        <button
          onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
          disabled={currentQIndex === 0}
          className="px-6 py-3 rounded-xl font-medium text-slate-600 disabled:opacity-30"
        >
          Previous
        </button>
        {currentQIndex === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            className="px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg"
          >
            Submit Exam
          </button>
        ) : (
          <button
            onClick={() => setCurrentQIndex((prev) => Math.min(questions.length - 1, prev + 1))}
            className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800"
          >
            Next Question
          </button>
        )}
      </div>
    </div>
  );
}