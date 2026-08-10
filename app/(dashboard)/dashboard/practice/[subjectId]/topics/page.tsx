"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Sparkles, Loader2, Coins } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";

const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://cbt.excelpracticehub.com"
).replace(/\/$/, "");

interface Topic {
  id: string;
  name: string;
  cost: number;
  questionCount?: number;
}

export default function TopicSelectionPage() {
  const { user, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [subjectName, setSubjectName] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [policy, setPolicy] = useState({ questionsPerCredit: 10 });

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) return;

      try {
        const [policyRes, subjectRes] = await Promise.all([
          fetch(`${API_BASE_URL}/credits/policy`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/subjects/${subjectId}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        const policyData = await policyRes.json();
        setPolicy(policyData);

        const subjectData = await subjectRes.json();
        setSubjectName(subjectData.name || subjectId);
        setTotalQuestions(subjectData.questionCount || 0);
        setTopics(subjectData.topics || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) fetchData();
  }, [subjectId, user, authLoading]);

  const calculateCredits = (questionCount: number): number => {
    if (questionCount === 0) return 0;
    return Math.ceil(questionCount / (policy.questionsPerCredit || 10));
  };

  const handleTopicClick = (topic: Topic) => {
    const cost = topic.cost ?? calculateCredits(topic.questionCount ?? 0);
    router.push(
      `/dashboard/practice/${subjectId}/start?topic=${encodeURIComponent(topic.id)}&topicName=${encodeURIComponent(topic.name)}&cost=${cost}&totalQuestions=${topic.questionCount ?? 0}`
    );
  };

  const handleAllTopics = () => {
    router.push(
      `/dashboard/practice/${subjectId}/start?cost=0&totalQuestions=${totalQuestions}`
    );
  };

  if (loading || authLoading) {
    return (
      <div className="p-10 flex justify-center">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4 py-8">
      <Link
        href="/dashboard/practice"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 transition"
      >
        <ArrowLeft size={18} /> Back to Practice Centre
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{subjectName}</h1>
        <p className="text-slate-500 mt-2">Choose a specific topic or select "All Topics"</p>
      </div>

      {/* All Topics Card */}
      <div
        onClick={handleAllTopics}
        className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-2xl cursor-pointer hover:shadow-xl transition group relative overflow-hidden text-white"
      >
        <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
          <span className="font-bold text-sm flex items-center gap-1">
            <Coins size={14} /> 0 credits
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/20 rounded-xl">
            <Sparkles size={28} />
          </div>
          <div>
            <h3 className="text-xl font-bold">All Topics</h3>
            <p className="text-emerald-100 text-sm">Practice {totalQuestions} mixed questions</p>
          </div>
        </div>
      </div>

      {/* Individual Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((topic) => {
          const count = topic.questionCount ?? 0;
          const cost = topic.cost ?? calculateCredits(count);

          return (
            <div
              key={topic.id}
              onClick={() => handleTopicClick(topic)}
              className="bg-white border-2 border-slate-200 p-6 rounded-2xl transition group cursor-pointer hover:border-emerald-500 hover:shadow-lg"
            >
              <div className="flex items-start justify-between mb-3">
                <BookOpen size={24} className="text-emerald-600" />
                <div className="flex flex-col items-end gap-1">
                  {count > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      {count} Qs
                    </span>
                  )}
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                    <Coins size={10} /> {cost} credits
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{topic.name}</h3>
              <span className="text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition">
                Start →
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}