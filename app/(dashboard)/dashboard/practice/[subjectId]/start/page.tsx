"use client";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc, increment, addDoc, collection, serverTimestamp, getDoc } from "firebase/firestore";
import { Loader2, BookOpen, ShieldCheck, AlertCircle, ArrowLeft, Coins } from "lucide-react";
import Link from "next/link";

export default function StartSubjectPracticePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const topicFilter = searchParams.get("topic");
  const router = useRouter();
  const { user, userData } = useAuth();

  // Extract values from URL
  const subjectId = params.subjectId as string;
  const cost = parseInt(searchParams.get("cost") || "5");

  const [isDeducting, setIsDeducting] = useState(false);
  const [subjectName, setSubjectName] = useState("Subject Practice");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjectName = async () => {
      try {
        const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
        if (subjectDoc.exists()) {
          setSubjectName(subjectDoc.data().name || "Subject Practice");
        }
      } catch (error) {
        console.error("Error fetching subject:", error);
      } finally {
        setLoading(false);
      }
    };

    if (subjectId) {
      fetchSubjectName();
    }
  }, [subjectId]);

  const handleConfirmStart = async () => {
    if (!user || !userData) return;
    if (userData.credits < cost) {
      router.push("/dashboard/buy-credits");
      return;
    }

    try {
      setIsDeducting(true);

      // 1. DEDUCT CREDITS IN FIREBASE
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        credits: increment(-cost),
      });

      // 2. LOG THE USAGE
      await addDoc(collection(db, "creditUsage"), {
        userId: user.uid,
        examType: "subject-practice",
        subjectId: subjectId,
        subjectName: subjectName,
        topic: topicFilter || null, // ✅ Log which topic was practiced
        creditsSpent: cost,
        date: serverTimestamp(),
      });

      // 3. REDIRECT TO THE ACTUAL PRACTICE SESSION — pass topic if present
     // ✅ Fixed
const destination = topicFilter
  ? `/dashboard/practice/${subjectId}/exam?topic=${encodeURIComponent(topicFilter)}`
  : `/dashboard/practice/${subjectId}/exam`;
      router.push(destination);
    } catch (error) {
      console.error("Failed to start practice:", error);
      alert("Error processing credits. Please try again.");
      setIsDeducting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <p className="text-slate-500">
        {topicFilter
          ? `Practice ${topicFilter.replace(/-/g, " ")} questions`
          : "Practice all topics in this subject"}
      </p>
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
          {/* ✅ Show topic name in header if selected */}
          {topicFilter && (
            <p className="text-emerald-200 mt-1 text-sm font-medium capitalize">
              Topic: {topicFilter.replace(/-/g, " ")}
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
                  <Coins size={16} /> {userData?.credits || 0}
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
                  <Coins size={20} /> {(userData?.credits || 0) - cost}
                </span>
              </div>
            </div>

            {/* Info Box */}
            <div className="flex gap-3 p-4 bg-blue-50 rounded-xl border border-blue-100 text-blue-800 text-sm">
              <BookOpen className="flex-shrink-0" size={20} />
              <p>
                This practice session will include questions from{" "}
                <strong className="capitalize">{subjectName}</strong>
                {topicFilter && (
                  <>
                    {" "}— specifically the{" "}
                    <strong className="capitalize">{topicFilter.replace(/-/g, " ")}</strong> topic
                  </>
                )}
                . You can practice at your own pace without time limits.
              </p>
            </div>

            {/* Warning Info */}
            <div className="flex gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100 text-amber-800 text-sm">
              <AlertCircle className="flex-shrink-0" size={20} />
              <p>
                Credits are deducted once you click "Start". Ensure you have a stable internet
                connection before proceeding.
              </p>
            </div>

            <button
              onClick={handleConfirmStart}
              disabled={isDeducting || (userData?.credits || 0) < cost}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-lg"
            >
              {isDeducting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <ShieldCheck size={22} />
                  Confirm & Start Practice
                </>
              )}
            </button>

            {(userData?.credits || 0) < cost && (
              <p className="text-center text-red-500 font-medium text-sm">
                You do not have enough credits for this practice session.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}