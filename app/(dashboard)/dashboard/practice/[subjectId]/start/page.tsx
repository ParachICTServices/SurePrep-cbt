"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { userService } from "@/app/lib/api/services/userService";
import { Loader2, BookOpen, ShieldCheck, AlertCircle, ArrowLeft, Coins } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast"; // ✅ Added missing import

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function StartSubjectPracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get("topic");
  const topicName = searchParams.get("topicName") || "";
  const router = useRouter();

  const { user, loading: authLoading, refreshUser } = useAuth();

  const subjectId = params.subjectId as string;
  const cost = parseInt(searchParams.get("cost") || "5");

  const [isDeducting, setIsDeducting] = useState(false);
  const [subjectName, setSubjectName] = useState("Subject Practice");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectName = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setSubjectName(data.name || "Subject Practice");
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

  // ✅ Restored as a proper handler function (was incorrectly floating in component body)
  const handleConfirmStart = async () => {
    if (!user) return;

    setIsDeducting(true); // ✅ Was never set to true before the async call

    try {
      const token = localStorage.getItem("auth_token");

      const response = await fetch(`${API_BASE_URL}/credits/open-subject-topic`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: subjectId,
          topic: topicFilter ?? "all-topics",
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Insufficient credits or invalid session");
      }

      await refreshUser();

      const destination = topicFilter
        ? `/dashboard/practice/${subjectId}/exam?topic=${encodeURIComponent(topicFilter)}`
        : `/dashboard/practice/${subjectId}/exam`;

      router.push(destination);
    } catch (error: any) {
      toast.error(error.message);
      setIsDeducting(false); // ✅ Only reset on failure; on success we're navigating away
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
  const canAfford = currentCredits >= cost;

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
            {/* Credit Breakdown */}
            <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center text-slate-600">
                <span>Current Balance</span>
                <span className="font-bold flex items-center gap-1">
                  <Coins size={16} /> {currentCredits.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-red-600">
                <span>Session Cost</span>
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
              <p>Credits are non-refundable once the session begins.</p>
            </div>

            <button
              onClick={handleConfirmStart}
              disabled={isDeducting || !canAfford}
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
                  Confirm & Start
                </>
              )}
            </button>

            {!canAfford && (
              <p className="text-center text-red-500 font-medium text-sm">
                Insufficient credits. Please top up.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}