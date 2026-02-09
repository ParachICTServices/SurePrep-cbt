"use client";
import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import { Users, FileText, BookOpen, Activity } from "lucide-react";

export default function AdminOverview() {
  const [stats, setStats] = useState({ users: 0, questions: 0, subjects: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Note: getCountFromServer is efficient for counting
        const userColl = collection(db, "users");
        const qColl = collection(db, "questions");
        const subColl = collection(db, "subjects");

        const userSnapshot = await getCountFromServer(userColl);
        const qSnapshot = await getCountFromServer(qColl);
        const subSnapshot = await getCountFromServer(subColl);

        setStats({
          users: userSnapshot.data().count,
          questions: qSnapshot.data().count,
          subjects: subSnapshot.data().count
        });
      } catch (e) {
        console.error("Error fetching stats", e);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Dashboard Overview</h1>
        <p className="text-slate-500">Welcome back, Admin.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Total Students" value={stats.users} icon={<Users size={24} />} color="bg-blue-500" />
        <StatCard title="Total Questions" value={stats.questions} icon={<FileText size={24} />} color="bg-emerald-500" />
        <StatCard title="Active Subjects" value={stats.subjects} icon={<BookOpen size={24} />} color="bg-purple-500" />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center py-20">
        <Activity size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-900">Real-time Activity Log</h3>
        <p className="text-slate-400 text-sm">Detailed user analytics coming in Phase 2.</p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-gray-200`}>
        {icon}
      </div>
    </div>
  );
}