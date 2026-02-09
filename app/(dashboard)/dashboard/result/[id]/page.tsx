"use client";
import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, Lock, Zap } from "lucide-react";
import Link from "next/link";

export default function ExamResultReview() {
  const { id } = useParams(); // Get the Result ID from URL
  const { userData } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const isPremium = userData?.subscriptionStatus === 'premium';

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "testResults", id as string);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setResult(docSnap.data());
        }
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) return <div className="p-10 text-center">Loading review...</div>;
  if (!result) return <div className="p-10 text-center">Result not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Link href="/dashboard" className="text-slate-500 hover:text-emerald-600 flex items-center gap-2 mb-2 text-sm font-bold">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">{result.subject.replace(/-/g, ' ')} Review</h1>
          <p className="text-slate-500">
            You scored <span className="font-bold text-emerald-600">{result.score}/{result.totalQuestions}</span>
          </p>
        </div>
        <div className={`px-4 py-2 rounded-xl font-bold text-xl ${result.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
          {result.percentage}%
        </div>
      </div>

      {/* Questions Review List */}
      <div className="space-y-6">
        {result.history?.map((q: any, index: number) => {
          const isCorrect = q.selectedOption === q.correctOption;
          const isSkipped = q.selectedOption === -1;

          return (
            <div key={index} className={`bg-white p-6 rounded-2xl border-2 ${isCorrect ? 'border-emerald-100' : 'border-red-50'}`}>
              
              <div className="flex gap-4 mb-4">
                <span className="flex-shrink-0 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 text-sm">
                  {index + 1}
                </span>
                <h3 className="font-medium text-slate-900 text-lg leading-relaxed">
                  {q.questionText}
                </h3>
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pl-12">
                {q.options.map((opt: string, optIdx: number) => {
                  let optionColor = "bg-slate-50 border-slate-100 text-slate-500"; // Default
                  
                  // Logic for coloring options
                  if (optIdx === q.correctOption) {
                    optionColor = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold"; // Correct Answer
                  } else if (optIdx === q.selectedOption && !isCorrect) {
                    optionColor = "bg-red-100 border-red-500 text-red-900"; // User's Wrong Choice
                  }

                  return (
                    <div key={optIdx} className={`p-3 rounded-lg border text-sm flex items-center justify-between ${optionColor}`}>
                      <span className="flex items-center gap-2">
                        <span className="font-bold opacity-50">{String.fromCharCode(65 + optIdx)}.</span> {opt}
                      </span>
                      {optIdx === q.correctOption && <CheckCircle size={16} className="text-emerald-600" />}
                      {optIdx === q.selectedOption && !isCorrect && <XCircle size={16} className="text-red-600" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanation Section (Premium Feature) */}
              <div className="pl-12">
                {isPremium ? (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <h4 className="font-bold text-blue-800 text-sm mb-1 flex items-center gap-2">
                      <Zap size={16} fill="currentColor" /> Explanation
                    </h4>
                    <p className="text-blue-900/80 text-sm">
                      {q.explanation || "No explanation available for this question."}
                    </p>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500 text-sm">
                      <Lock size={16} />
                      <span>Explanation hidden (Premium only)</span>
                    </div>
                    <Link href="/dashboard/upgrade" className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">
                      Unlock
                    </Link>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}