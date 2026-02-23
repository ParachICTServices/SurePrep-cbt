"use client";
import { useEffect, useState } from "react";
import {
  collection, getCountFromServer, getDocs, query,
  orderBy, limit, where, getAggregateFromServer, sum
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import {
  Users, FileText, BookOpen, Coins, TrendingUp, 
  BarChart2, ArrowUpRight, RefreshCw
} from "lucide-react";
import Link from "next/link";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, questions: 0, subjects: 0, totalCredits: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [subjectDist, setSubjectDist] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    
    try {
      // 1. Core Counts
      const [userSnap, qSnap, subSnap] = await Promise.all([
        getCountFromServer(collection(db, "users")),
        getCountFromServer(collection(db, "questions")),
        getCountFromServer(collection(db, "subjects")),
      ]);

      // 2. Sum of all Credits on the platform
      const creditSnap = await getAggregateFromServer(
        collection(db, "users"),
        { totalCredits: sum("credits") }
      );

      setStats({
        users: userSnap.data().count,
        questions: qSnap.data().count,
        subjects: subSnap.data().count,
        totalCredits: creditSnap.data().totalCredits || 0,
      });

      // 3. Recent 5 users
      const recentQ = query(
        collection(db, "users"), 
        orderBy("createdAt", "desc"), 
        limit(5)
      );
      const recentSnap = await getDocs(recentQ);
      const recentData = recentSnap.docs.map(d => ({ 
        id: d.id, 
        ...d.data() 
      }));
      
      console.log("Recent users fetched:", recentData.length);
      setRecentUsers(recentData);

    
      const subjectsSnap = await getDocs(collection(db, "subjects"));
      const subjectData = subjectsSnap.docs.map(d => d.data());

      const counts = await Promise.all(
        subjectData.map(async (sub) => {
          const snap = await getCountFromServer(
            query(collection(db, "questions"), where("subject", "==", sub.id))
          );
          
          // Extract the actual color from the Firestore data
          const colorString = sub.color as string || "bg-slate-100 text-slate-600";
          
          // Log to debug
          console.log("Subject:", sub.name, "Color string:", colorString);
          
          return { 
            name: sub.name as string, 
            count: snap.data().count, 
            color: colorString 
          };
        })
      );
      counts.sort((a, b) => b.count - a.count);
      setSubjectDist(counts);

    } catch (e) {
      console.error("Error fetching admin stats:", e);
    } finally {
      setLoading(false);
      if (isRefresh) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleRefresh = () => {
    fetchAllData(true);
  };

  const maxQCount = subjectDist.length > 0 ? subjectDist[0].count : 1;

  const formatDate = (dateString: string) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return "Recently";
    }
  };

 
  const extractBackgroundColor = (colorString: string): string => {

    
    const colorMap: {[key: string]: string} = {
      
      'bg-blue-100': '#DBEAFE',
      'bg-blue-600': '#2563EB',
      'bg-emerald-100': '#D1FAE5',
      'bg-emerald-600': '#059669',
      'bg-orange-100': '#FFEDD5',
      'bg-orange-600': '#EA580C',
      'bg-purple-100': '#F3E8FF',
      'bg-purple-600': '#9333EA',
      'bg-red-100': '#FEE2E2',
      'bg-red-600': '#DC2626',
      'bg-indigo-100': '#E0E7FF',
      'bg-indigo-600': '#4F46E5',
      'bg-teal-100': '#CCFBF1',
      'bg-teal-600': '#0D9488',
      'bg-pink-100': '#FCE7F3',
      'bg-pink-600': '#DB2777',
      'bg-slate-100': '#F1F5F9',
      'bg-slate-500': '#64748B',
      'bg-slate-600': '#475569',
    };
    
    // Find the bg-* class
    const bgClass = colorString.split(' ').find(c => c.startsWith('bg-'));
    
    if (!bgClass) {
      console.log("No bg class found in:", colorString);
      return '#64748B'; // Default gray
    }
    
    const color = colorMap[bgClass];
    
    if (!color) {
      console.log("Color not mapped:", bgClass);
      return '#64748B'; // Default gray
    }
    
    console.log("Mapped", bgClass, "to", color);
    return color;
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Admin Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">Platform credit economy and health.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 text-sm font-bold text-slate-700 bg-slate-100 border border-slate-200 px-4 py-2 rounded-xl hover:bg-slate-200 transition disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link 
            href="/admin/dashboard/users" 
            className="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition"
          >
            <Users size={16} /> Manage Users <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      {/* Primary stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Students" 
          value={stats.users} 
          icon={<Users size={20} />} 
          color="bg-blue-600" 
          loading={loading} 
        />
        <StatCard 
          title="Wallet Credits" 
          value={stats.totalCredits} 
          icon={<Coins size={20} />} 
          color="bg-amber-500" 
          loading={loading} 
          sub="Total across all users" 
        />
        <StatCard 
          title="Total Questions" 
          value={stats.questions} 
          icon={<FileText size={20} />} 
          color="bg-emerald-500" 
          loading={loading} 
        />
        <StatCard 
          title="Active Subjects" 
          value={stats.subjects} 
          icon={<BookOpen size={20} />} 
          color="bg-violet-500" 
          loading={loading} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Credit System Health */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-fit">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-5">
            <TrendingUp size={18} className="text-emerald-500" /> 
            Credit Insights
          </h2>
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-500 mb-1">Avg. Credits per User</p>
              <p className="text-xl font-bold text-slate-900">
                {stats.users > 0 ? Math.round(stats.totalCredits / stats.users) : 0}
              </p>
            </div>
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs text-emerald-700 mb-1">Platform Activity</p>
              <p className="text-sm font-medium text-emerald-800">
                Users are actively redeeming credits for Mock Exams.
              </p>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
              <p className="text-xs text-blue-700 mb-1">Credit Circulation</p>
              <p className="text-sm font-medium text-blue-800">
                {stats.totalCredits.toLocaleString()} credits in active circulation
              </p>
            </div>
          </div>
        </div>

        {/* Questions Distribution - FIXED COLOR DISPLAY */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-bold text-slate-800 mb-5 flex items-center gap-2">
            <BarChart2 size={18} className="text-blue-500" /> 
            Content Distribution
          </h2>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-400">Loading...</div>
            ) : subjectDist.length === 0 ? (
              <div className="text-center py-8 text-slate-400">No subjects found</div>
            ) : (
              subjectDist.map((sub) => {
                const pct = Math.round((sub.count / maxQCount) * 100);
                const backgroundColor = extractBackgroundColor(sub.color);
                
                return (
                  <div key={sub.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 capitalize">{sub.name}</span>
                      <span className="font-bold text-slate-900">{sub.count} questions</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${pct}%`,
                          backgroundColor: backgroundColor
                        }} 
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-bold text-slate-800">Recent Onboarding</h2>
          <Link href="/admin/dashboard/users" className="text-sm text-emerald-600 font-bold hover:underline">
            View All
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {loading ? (
            <div className="px-6 py-8 text-center text-slate-400">Loading recent users...</div>
          ) : recentUsers.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400">No users yet</div>
          ) : (
            recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center font-bold text-white shadow-md">
                  {(u.displayName || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">
                    {u.displayName || "New User"}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-100">
                    <Coins size={12} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700">{u.credits || 0}</span>
                  </div>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, loading, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900">
          {loading ? "..." : value.toLocaleString()}
        </h3>
        {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-gray-100`}>
        {icon}
      </div>
    </div>
  );
}