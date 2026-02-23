"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { db } from "@/app/lib/firebase";
import { doc, getDoc, collection, query, where, getCountFromServer } from "firebase/firestore";
import { ArrowLeft, BookOpen, Sparkles, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/app/context/AuthContext";


const SUBJECT_TOPICS: Record<string, string[]> = {
  mathematics: [
    'Numbers & Arithmetic', 'Ratio & Proportion', 'Indices, Logs & Surds', 'Sets',
    'Algebraic Expressions', 'Factorization', 'Quadratic Equations', 'Simultaneous Equations',
    'Graphs', 'Rational Expressions', 'Inequalities', 'Geometry', 'Trigonometry',
    'Calculus', 'Statistics', 'Probability', 'Vectors'
  ],
  physics: [
    'Measurement & Units', 'Motion', 'Equilibrium of Forces', 'Work, Energy & Power',
    'Simple Machines', 'Elasticity', 'Hydrostatics', 'Temperature & Thermal Expansion',
    'Heat & Vapours', 'Molecular Theory', 'Waves & Sound', 'Light (Reflection/Refraction)',
    'Electrostatics', 'Current Electricity', 'Magnetism', 'Electromagnetism', 'Atomic Physics'
  ],
  chemistry: [
    'Particulate Nature of Matter', 'Stoichiometry', 'Gas Laws', 'Atomic Structure',
    'Periodic Table', 'Chemical Bonding', 'Thermodynamics', 'Chemical Kinetics',
    'Equilibrium', 'Acids, Bases & Salts', 'Electrochemistry', 'Organic Chemistry',
    'Metals & Non-Metals', 'Nuclear Chemistry'
  ],
  biology: [
    'Living Organisms', 'Cell Biology', 'Nutrition', 'Transport System',
    'Respiration', 'Excretion', 'Regulation & Homeostasis', 'Reproduction',
    'Genetics', 'Ecology', 'Evolution'
  ],
  english: [
    'Oral English', 'Comprehension', 'Summary', 'Lexis & Structure',
    'Essay Writing'
  ],
  literature: [
    'Drama', 'Prose', 'Poetry', 'Shakespeare', 'Literary Appreciation',
    'African Literature', 'Non-African Literature'
  ],
  economics: [
    'Basic Concepts', 'Economic Systems', 'Production', 'Market Structures',
    'Money & Inflation', 'Financial Institutions', 'Public Finance',
    'International Trade', 'Economic Development'
  ],
  government: [
    'Concepts of Government', 'Political Parties', 'Electoral Process',
    'Public Administration', 'Pre-Colonial Administration', 'Colonial Administration',
    'Constitutional Development', 'International Organizations'
  ],
  accounting: [
    'Book Keeping', 'Final Accounts', 'Partnership', 'Company Accounts',
    'Public Sector Accounting', 'Manufacturing Accounts'
  ],
  commerce: [
    'Occupation', 'Trade', 'Business Organization', 'Banking & Finance',
    'Transportation', 'Communication', 'Insurance', 'Advertising', 'Marketing'
  ]
};

// ⚠️ This must also match however the seeder formats topic IDs when tagging questions
const formatTopicId = (topic: string) => {
  return topic.toLowerCase().replace(/\s+/g, '-');
};

export default function TopicSelectionPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const subjectId = params.subjectId as string;

  const [subjectName, setSubjectName] = useState("");
  const [topicCounts, setTopicCounts] = useState<Record<string, number>>({});
  const [topicExamCounts, setTopicExamCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const topics = SUBJECT_TOPICS[subjectId] || [];

  // Defined at component level so both handleTopicClick and JSX can access it
  const getTopicCost = (topicId: string): number => {
    const count = topicExamCounts[topicId] || 0;
    if (count === 0) return 5;   // First attempt
    if (count < 3) return 3;     // 2nd–3rd attempt
    return 2;                    // 4th+ attempt
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get subject name
        const subjectDoc = await getDoc(doc(db, "subjects", subjectId));
        if (subjectDoc.exists()) {
          setSubjectName(subjectDoc.data().name);
        }

        // Get how many times user has attempted each topic
        if (user) {
          const countsPerTopic: Record<string, number> = {};
          await Promise.all(
            topics.map(async (topic) => {
              const topicId = formatTopicId(topic);
              const q = query(
                collection(db, "testResults"),
                where("userId", "==", user.uid),
                where("subjectId", "==", subjectId),
                where("topic", "==", topicId)
              );
              const snap = await getCountFromServer(q);
              countsPerTopic[topicId] = snap.data().count;
            })
          );
          setTopicExamCounts(countsPerTopic);
        }

        // Count available questions per topic
        const counts: Record<string, number> = {};
        await Promise.all(
          topics.map(async (topic) => {
            const topicId = formatTopicId(topic);
            try {
              const q = query(
                collection(db, "questions"),
                where("subject", "==", subjectId),
                where("topics", "array-contains", topicId)
              );
              const snapshot = await getCountFromServer(q);
              counts[topicId] = snapshot.data().count;
            } catch (error) {
              console.error(`Error counting ${topic}:`, error);
              counts[topicId] = 0;
            }
          })
        );
        setTopicCounts(counts);

      } catch (error) {
        console.error("Error fetching topics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [subjectId, user]);


const handleTopicClick = (topic: string) => {
  const topicId = formatTopicId(topic);
  const cost = getTopicCost(topicId);
  router.push(`/dashboard/practice/${subjectId}/start?topic=${encodeURIComponent(topicId)}&cost=${cost}`);
};

  const handleAllTopics = () => {
    router.push(`/dashboard/practice/${subjectId}/start?cost=5`);
  };

  if (loading) {
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
        <ArrowLeft size={18} />
        Back to Practice Centre
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-slate-900 capitalize">{subjectName || subjectId}</h1>
        <p className="text-slate-500 mt-2">
          Choose a specific topic to practice, or select "All Topics" for mixed practice
        </p>
      </div>

      {/* All Topics Option */}
      <div
        onClick={handleAllTopics}
        className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-2xl cursor-pointer hover:shadow-xl transition group"
      >
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl">
              <Sparkles size={28} />
            </div>
            <div>
              <h3 className="text-xl font-bold">All Topics</h3>
              <p className="text-emerald-100 text-sm">Practice questions from all topics randomly</p>
            </div>
          </div>
          <div className="opacity-0 group-hover:opacity-100 transition">
            <span className="text-white font-bold">Start →</span>
          </div>
        </div>
      </div>

      {/* Individual Topics */}
      {topics.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {topics.map((topic) => {
            const topicId = formatTopicId(topic);
            const questionCount = topicCounts[topicId] || 0;
            const cost = getTopicCost(topicId);
            const attemptCount = topicExamCounts[topicId] || 0;

            return (
              <div
                key={topicId}
                onClick={() => questionCount > 0 && handleTopicClick(topic)}
                className={`bg-white border-2 border-slate-200 p-6 rounded-2xl transition group ${
                  questionCount > 0
                    ? 'cursor-pointer hover:border-emerald-500 hover:shadow-lg'
                    : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <BookOpen
                    size={24}
                    className={questionCount > 0 ? 'text-emerald-600' : 'text-slate-400'}
                  />
                  <div className="flex flex-col items-end gap-1">
                    {/* Question count badge */}
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      questionCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {questionCount} {questionCount === 1 ? 'question' : 'questions'}
                    </span>

                    {/* Dynamic cost badge */}
                    {questionCount > 0 && (
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        cost === 5 ? 'bg-amber-100 text-amber-700' :
                        cost === 3 ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {cost} credits
                        {attemptCount > 0 && (
                          <span className="ml-1 opacity-70">· {attemptCount}x done</span>
                        )}
                      </span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">{topic}</h3>
                <p className="text-sm text-slate-500">
                  {questionCount > 0 ? (
                    <>Practice focused questions on {topic.toLowerCase()}</>
                  ) : (
                    <>No questions available yet</>
                  )}
                </p>

                {questionCount > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <span className="text-emerald-600 font-bold text-sm opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                      Start Practice →
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-slate-500">Topics not configured for this subject yet.</p>
          <button
            onClick={handleAllTopics}
            className="mt-4 px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition"
          >
            Practice All Questions
          </button>
        </div>
      )}
    </div>
  );
}