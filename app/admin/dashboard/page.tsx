"use client";
import { useEffect, useState } from "react";
import {
  collection, getCountFromServer, getDocs, query,
  orderBy, limit, where
} from "firebase/firestore";
import { db } from "@/app/lib/firebase";
import {
  Users, FileText, BookOpen, Crown, UserCheck,
  TrendingUp, BarChart2, ArrowUpRight
} from "lucide-react";
import Link from "next/link";

interface UserRow {
  id: string;
  displayName?: string;
  email?: string;
  subscriptionStatus?: string;
  createdAt?: any;
}

export default function AdminOverview() {
  const [stats, setStats] = useState({
    users: 0, questions: 0, subjects: 0, premium: 0, free: 0
  });
  const [recentUsers, setRecentUsers] = useState<UserRow[]>([]);
  const [subjectDist, setSubjectDist] = useState<{ name: string; count: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        // ── Counts ──────────────────────────────────────────────────────────
        const [userSnap, qSnap, subSnap] = await Promise.all([
          getCountFromServer(collection(db, "users")),
          getCountFromServer(collection(db, "questions")),
          getCountFromServer(collection(db, "subjects")),
        ]);

        // Premium vs free breakdown
        const premiumSnap = await getCountFromServer(
          query(collection(db, "users"), where("subscriptionStatus", "==", "premium"))
        );
        const premiumCount = premiumSnap.data().count;
        const totalUsers = userSnap.data().count;

        setStats({
          users: totalUsers,
          questions: qSnap.data().count,
          subjects: subSnap.data().count,
          premium: premiumCount,
          free: totalUsers - premiumCount,
        });

        // ── Recent 5 users ───────────────────────────────────────────────────
        try {
          const recentQ = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
          const recentSnap = await getDocs(recentQ);
          setRecentUsers(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserRow)));
        } catch {
          // createdAt index might not exist — fallback without ordering
          const fallbackSnap = await getDocs(query(collection(db, "users"), limit(5)));
          setRecentUsers(fallbackSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserRow)));
        }

        // ── Questions per subject ────────────────────────────────────────────
        const subjectsSnap = await getDocs(collection(db, "subjects"));
        const subjectData = subjectsSnap.docs.map(d => d.data());

        const counts = await Promise.all(
          subjectData.map(async (sub) => {
            const snap = await getCountFromServer(
              query(collection(db, "questions"), where("subject", "==", sub.id))
            );
            return { name: sub.name as string, count: snap.data().count, color: sub.color as string };
          })
        );
        // Sort descending
        counts.sort((a, b) => b.count - a.count);
        setSubjectDist(counts);

      } catch (e) {
        console.error("Error fetching stats", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const premiumPct = stats.users > 0 ? Math.round((stats.premium / stats.users) * 100) : 0;
  const maxQCount = subjectDist.length > 0 ? subjectDist[0].count : 1;

  const formatDate = (val: any): string => {
    if (!val) return "—";
    try {
      if (val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
      return new Date(val).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
    } catch { return "—"; }
  };

  return (
    <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1 text-sm">Platform health at a glance.</p>
        </div>
        <Link
          href="/admin/dashboard/users"
          className="hidden sm:flex items-center gap-2 text-sm font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl hover:bg-emerald-100 transition"
        >
          <Users size={16} /> Manage Users <ArrowUpRight size={14} />
        </Link>
      </div>

      {/* ── Primary stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats.users} icon={<Users size={20} />} color="bg-blue-500" loading={loading} />
        <StatCard title="Premium Users" value={stats.premium} icon={<Crown size={20} />} color="bg-amber-500" loading={loading}
          sub={`${premiumPct}% conversion`} />
        <StatCard title="Total Questions" value={stats.questions} icon={<FileText size={20} />} color="bg-emerald-500" loading={loading} />
        <StatCard title="Active Subjects" value={stats.subjects} icon={<BookOpen size={20} />} color="bg-violet-500" loading={loading} />
      </div>

      {/* ── Middle row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Subscription split */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">Subscription Split</h2>
            <TrendingUp size={18} className="text-slate-400" />
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center text-slate-300">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Donut-style visual using CSS */}
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.8" />
                    <circle
                      cx="18" cy="18" r="15.9" fill="none"
                      stroke="#f59e0b" strokeWidth="3.8"
                      strokeDasharray={`${premiumPct} ${100 - premiumPct}`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold text-slate-900">{premiumPct}%</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 flex-1">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                        Premium
                      </span>
                      <span className="font-bold text-slate-900">{stats.premium}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${premiumPct}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300 inline-block" />
                        Free
                      </span>
                      <span className="font-bold text-slate-900">{stats.free}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full">
                      <div className="h-full bg-slate-300 rounded-full transition-all" style={{ width: `${100 - premiumPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Questions per subject bar chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-slate-800">Questions per Subject</h2>
            <BarChart2 size={18} className="text-slate-400" />
          </div>

          {loading ? (
            <div className="h-32 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : subjectDist.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-10">No data yet.</p>
          ) : (
            <div className="space-y-3">
              {subjectDist.map((sub) => {
                const pct = maxQCount > 0 ? Math.round((sub.count / maxQCount) * 100) : 0;
                // Extract a base Tailwind color from the stored class string e.g. "bg-blue-100 text-blue-600"
                const barColor = sub.color?.includes("emerald") ? "bg-emerald-500"
                  : sub.color?.includes("blue") ? "bg-blue-500"
                  : sub.color?.includes("orange") ? "bg-orange-500"
                  : sub.color?.includes("purple") ? "bg-purple-500"
                  : sub.color?.includes("pink") ? "bg-pink-500"
                  : sub.color?.includes("violet") ? "bg-violet-500"
                  : sub.color?.includes("teal") ? "bg-teal-500"
                  : sub.color?.includes("red") ? "bg-red-500"
                  : sub.color?.includes("yellow") ? "bg-yellow-500"
                  : "bg-slate-500";

                return (
                  <div key={sub.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700 capitalize">{sub.name}</span>
                      <span className="font-bold text-slate-900 tabular-nums">{sub.count}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Recent users ───────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <UserCheck size={18} className="text-emerald-600" /> Recent Sign-ups
          </h2>
          <Link
            href="/admin/dashboard/users"
            className="text-sm font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-emerald-500 rounded-full animate-spin" />
          </div>
        ) : recentUsers.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-10">No users yet.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center text-slate-600 font-bold text-sm flex-shrink-0">
                  {(u.displayName || u.email || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-sm truncate">
                    {u.displayName || "—"}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className={`text-[10px] font-bold px-2 py-1 rounded-full
                    ${u.subscriptionStatus === "premium"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-slate-100 text-slate-500"}`}>
                    {u.subscriptionStatus === "premium" ? "Premium" : "Free"}
                  </span>
                  <span className="text-xs text-slate-400 hidden sm:block">
                    {formatDate(u.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, loading, sub }: any) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 mb-1 truncate">{title}</p>
        {loading ? (
          <div className="h-8 w-16 bg-slate-100 rounded animate-pulse" />
        ) : (
          <h3 className="text-3xl font-bold text-slate-900 tabular-nums">{value.toLocaleString()}</h3>
        )}
        {sub && !loading && (
          <p className="text-xs text-slate-400 mt-0.5">{sub}</p>
        )}
      </div>
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 text-white ${color} shadow-lg shadow-gray-100`}>
        {icon}
      </div>
    </div>
  );
}