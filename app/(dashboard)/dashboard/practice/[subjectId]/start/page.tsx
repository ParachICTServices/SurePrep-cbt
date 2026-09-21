"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { FREE_QUESTION_LIMIT } from "@/app/lib/questionAccess";
import { Loader2, BookOpen, ShieldCheck, AlertCircle, ArrowLeft, Coins } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { subjectService } from "@/app/lib/api/services/subjectService";
import { examService } from "@/app/lib/api/services/examService";

export default function StartSubjectPracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get("topic");
  const topicName = searchParams.get("topicName") || "";
  const examType = searchParams.get("examType") || "jamb";
  const router = useRouter();

  const { user, loading: authLoading } = useAuth();

  const subjectId = params.subjectId as string;

  const [isDeducting, setIsDeducting] = useState(false);
  const [subjectName, setSubjectName] = useState("Subject Practice");
  const [loading, setLoading] = useState(true);
  const [completedQuestions, setCompletedQuestions] = useState(0);

  useEffect(() => {
    const fetchSubjectName = async () => {
      try {
        const [subject, results] = await Promise.all([
          subjectService.getSubject(subjectId),
          examService.getTestResults({ type: "practice", limit: 1000 }),
        ]);
        setSubjectName(subject.name || "Subject Practice");
        const questionIds = results
          .filter((result) => result.subjectId === subjectId)
          .flatMap((result) => (result.history || []).map((question) => question.questionId))
          .filter((questionId): questionId is string => Boolean(questionId));
        setCompletedQuestions(new Set(questionIds).size);
      } catch (error) {
        console.error("Error fetching subject:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subjectId && !authLoading) {
      fetchSubjectName();
    }
  }, [subjectId, authLoading]);

  const handleConfirmStart = async () => {
    if (!user) return;

    setIsDeducting(true);

    try {
      const destination = topicFilter
        ? `/dashboard/practice/${subjectId}/exam?examType=${encodeURIComponent(examType)}&topic=${encodeURIComponent(topicFilter)}`
        : `/dashboard/practice/${subjectId}/exam?examType=${encodeURIComponent(examType)}`;

      router.push(destination);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Unable to start practice session.");
      setIsDeducting(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const currentCredits = user?.credits || 0;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Link
        href="/dashboard/practice"
        className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 mb-8 transition"
      >
        <ArrowLeft size={20} /> Back to Practice Centre
      </Link>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-8 text-white text-center">
          <div className="bg-white/20 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <BookOpen size={32} />
          </div>
          <h1 className="text-2xl font-bold capitalize">{subjectName}</h1>
          {topicName && (
            <p className="text-emerald-200 mt-1 text-sm font-medium capitalize">
              Topic: {topicName}
            </p>
          )}
          <p className="text-emerald-100 mt-2">Ready to start your practice session?</p>
        </div>

        <div className="p-8">
          <div className="space-y-6">
            <div className="bg-slate-50 rounded-2xl p-6 space-y-2">
              <div className="flex justify-between items-center text-slate-600">
                <span>Access</span>
                <span className="font-bold text-emerald-600">Free for registered users</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Current Balance</span>
                <span className="font-bold flex items-center gap-1">
                  <Coins size={16} /> {currentCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200">
                <span>Free Questions Completed</span>
                <span className="font-bold text-slate-900">
                  {Math.min(completedQuestions, FREE_QUESTION_LIMIT)} / {FREE_QUESTION_LIMIT}
                </span>
              </div>
            </div>

            <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
              <BookOpen className="flex-shrink-0" size={20} />
              <p>
                Session: <strong className="capitalize">{subjectName}</strong>
                {topicName && <> ({topicName})</>}. Practice at your own
                pace.
              </p>
            </div>

            <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
              <AlertCircle className="flex-shrink-0" size={20} />
              <p>
                {completedQuestions >= FREE_QUESTION_LIMIT
                  ? "You've completed the 100 free practice questions for this subject. Unlock more questions to continue."
                  : "Practice sessions are free. You can start whenever you are ready."}
              </p>
            </div>

            <button
              onClick={handleConfirmStart}
              disabled={isDeducting}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isDeducting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <ShieldCheck size={22} />
                  {completedQuestions >= FREE_QUESTION_LIMIT ? "Continue Practicing" : "Confirm & Start"}
                </>
              )}
            </button>


          </div>
        </div>
      </div>
    </div>
  );
}