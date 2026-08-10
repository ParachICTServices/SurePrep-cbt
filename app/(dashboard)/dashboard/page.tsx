"use client";

import { useAuth } from "@/app/context/AuthContext"; 
import { useEffect, useState } from "react";
import { Trophy, Clock, TrendingUp, ArrowRight, Activity, Calendar, Zap, Loader2, Coins, Wallet, CreditCard } from "lucide-react";
import Link from "next/link";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function DashboardOverview() {

  const { user, loading: authLoading } = useAuth();
  
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalTests: 0, averageScore: 0 });
  const [dataLoading, setDataLoading] = useState(true);

  const categoryNames = {
    senior: "Senior Secondary (JAMB/WAEC)",
    junior: "Junior Secondary (BECE/Common Entrance)",
    professional: "Job Interview & Career",
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token || !user) return;

      try {
    
        const statsRes = await fetch(`${API_BASE_URL}/users/me/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const statsData = await statsRes.json();

        
        const resultsRes = await fetch(`${API_BASE_URL}/test-results?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const resultsData = await resultsRes.json();

      
        setStats({
          totalTests: statsData.testStats?.totalTests || 0,
          averageScore: Math.round(statsData.testStats?.averageScore || 0)
        });

      
        const resultsArray = Array.isArray(resultsData) ? resultsData : (resultsData.results || []);
        
        const formattedResults = resultsArray.map((res: any) => ({
          id: res.id,
          date: res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'Recent', 
          percentage: res.scorePercentage || res.percentage || 0,
          subject: res.subject?.name || res.subject || "General Test",
          score: res.score || 0,
          totalQuestions: res.totalQuestions || 0
        }));

        setRecentActivity(formattedResults);
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setDataLoading(false);
      }
    };

    if (!authLoading) fetchDashboardData();
  }, [authLoading, user]);

  if (authLoading || dataLoading) {
    return (
      <div className="p-8 flex items-center justify-center h-screen">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* 1. Welcome & Primary CTA */}
      <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Hello, <span className="text-emerald-600">{user?.displayName || "Scholar"}</span>! 🚀
          </h1>
          <p className="text-slate-500 max-w-md mb-6">
            Your CBT practice is free for registered users. Start practicing with your account — no subscription required.
            <br /> You are preparing for <span className="font-bold text-slate-700">{categoryNames[user?.examCategory as keyof typeof categoryNames] || "your exams"}</span>.
          </p>
          
          <div className="flex flex-wrap gap-4">
            <Link href="/dashboard/practice" className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition flex items-center gap-2">
              Enter Practice Centre <ArrowRight size={18} />
            </Link>
            <Link href="/dashboard/buy-credits" className="px-6 py-3 bg-white text-emerald-600 font-bold rounded-xl border-2 border-emerald-100 hover:bg-emerald-50 transition flex items-center gap-2">
              <Coins size={18} /> Buy Credits
            </Link>
          </div>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 opacity-10">
           <Trophy size={200} className="text-emerald-600 transform translate-x-10 translate-y-10" />
        </div>
      </div>

      {/* 2. Key Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          icon={<Wallet size={24} />} 
          label="Credit Balance" 
          value={user?.credits || 0} 
          subtext="Available for exams"
          color={ (user?.credits || 0) < 15 ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}
        />
        <StatCard 
          icon={<Trophy size={24} />} 
          label="Average Score" 
          value={`${stats.averageScore}%`} 
          subtext="Based on all tests"
          color="bg-amber-100 text-amber-600"
        />
        <StatCard 
          icon={<TrendingUp size={24} />} 
          label="Tests Taken" 
          value={stats.totalTests}
          subtext="Lifetime sessions"
          color="bg-blue-100 text-blue-600"
        />
      </div>

      {/* 3. Recent Activity List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
              <Activity size={20} className="text-slate-400" /> Recent Activity
            </h3>
            <Link href="/dashboard/practice" className="text-sm text-emerald-600 font-semibold hover:underline">
              Take a new test
            </Link>
          </div>

          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((item) => (
                <Link href={`/dashboard/result/${item.id}`} key={item.id} className="block hover:bg-slate-50 transition">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${item.percentage >= 50 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        <Calendar size={18} />
                      </div>
                      <div>
                        <span className="block font-bold text-slate-700">{item.subject}</span>
                        <span className="text-xs text-slate-500">{item.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-500 hidden sm:block">{item.score}/{item.totalQuestions}</span>
                      <span className={`font-bold px-3 py-1 rounded-lg ${item.percentage >= 50 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
              <Calendar size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500 font-medium">No tests taken yet.</p>
              <Link href="/dashboard/practice" className="text-emerald-600 font-bold text-sm hover:underline">Start your first test</Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <div className="bg-white/10 w-fit p-2 rounded-lg mb-4">
                <Zap size={20} className="text-yellow-400" fill="currentColor" />
              </div>
              <h3 className="font-bold text-lg mb-2">Tip of the Day</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                "Consistency beats intensity. It is better to practice for 30 minutes every day than for 5 hours once a week."
              </p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
            <h4 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <CreditCard size={18} className="text-emerald-600" /> Quick Top-up
            </h4>
            <p className="text-xs text-slate-500 mb-4">Low on credits? Get a bundle to continue your practice sessions.</p>
            <Link href="/dashboard/buy-credits" className="block text-center py-2 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-sm hover:bg-emerald-100 transition">
              View Credit Packages
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, color }: any) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start gap-4 hover:shadow-md transition">
      <div className={`p-3 rounded-xl ${color} flex-shrink-0`}>{icon}</div>
      <div>
        <p className="text-slate-500 text-sm font-medium mb-1">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        <p className="text-xs text-slate-400 mt-1">{subtext}</p>
      </div>
    </div>
  );
}