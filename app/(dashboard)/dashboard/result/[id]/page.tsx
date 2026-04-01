"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, ArrowLeft, Lock, Zap, Loader2 } from "lucide-react";
import Link from "next/link";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function ExamResultReview() {
  const { id } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);

const isPremium = user?.credits && user.credits > 0;

  useEffect(() => {
    const fetchResult = async () => {
      if (!id) return;
      const token = localStorage.getItem('auth_token');
      
      try {
        const response = await fetch(`${API_BASE_URL}/test-results/my/${id}`, {
          headers: { 
            'Authorization': `Bearer ${token}` 
          }
        });

        if (!response.ok) throw new Error("Failed to fetch result");

        const data = await response.json();
        
        const cleanResult: any = {
          subject: data.subject || data.subjectName || 'Unknown',
          score: data.score || 0,
          totalQuestions: data.totalQuestions || 0,
          percentage: data.percentage || 0,
history: data.history || [],
          date: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recent'
        };
        
        setResult(cleanResult);
      } catch (error) {
        console.error("Error fetching result:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchResult();
    }
  }, [id, authLoading]);

  if (loading || authLoading) {
    return (
      <div className="p-20 flex flex-col items-center justify-center gap-4">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
        <p className="text-slate-500">Loading result review...</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-20 text-center">
        <h2 className="text-xl font-bold text-slate-800">Result not found</h2>
        <Link href="/dashboard" className="text-emerald-600 hover:underline mt-4 inline-block">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <Link href="/dashboard" className="text-slate-500 hover:text-emerald-600 flex items-center gap-2 mb-2 text-sm font-bold">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 capitalize">
            {result.subject.replace(/-/g, ' ')} Review
          </h1>
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
          const isSkipped = q.selectedOption === -1 || q.selectedOption === null;

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
                  
                  if (optIdx === q.correctOption) {
                    optionColor = "bg-emerald-100 border-emerald-500 text-emerald-900 font-bold";
                  } else if (optIdx === q.selectedOption && !isCorrect) {
optionColor = "bg-red-100 border-red-500 text-red-900";
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

              {/* Explanation Section */}
              <div className="pl-12">
                {/* Adjusting the premium check to your actual data logic */}
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
                      <span>Explanation hidden (Join Premium to unlock)</span>
                    </div>
                    <Link href="/dashboard/buy-credits" className="text-xs bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-emerald-700">
                      Get Credits
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