"use client";

import { useAuth } from "@/app/context/AuthContext";
import { useEffect, useMemo, useState } from "react";
import {
  Trophy,
  TrendingUp,
  ArrowRight,
  Activity,
  Calendar,
  Zap,
  Loader2,
  Coins,
  Wallet,
  CreditCard,
  Target,
  BookOpen,
  Timer,
  Flame,
} from "lucide-react";
import Link from "next/link";
import { examService } from "@/app/lib/api/services/examService";

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Accepts ISO strings, Date, millisecond/second numbers, Firestore Timestamps and {seconds} objects. */
function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "object") {
    const v = value as { toDate?: () => Date; seconds?: number; _seconds?: number };
    if (typeof v.toDate === "function") return toDate(v.toDate());
    const secs = v.seconds ?? v._seconds;
    if (typeof secs === "number") return new Date(secs * 1000);
    return null;
  }
  if (typeof value === "number") {
    const d = new Date(value < 1e12 ? value * 1000 : value);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof value === "string") {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
}

const timeOnly = new Intl.DateTimeFormat("en-GB", { hour: "numeric", minute: "2-digit", hour12: true });
const dayMonth = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" });
const dayMonthYear = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** "Today, 2:30 pm" / "Yesterday, 9:05 am" / "3 days ago" / "12 Oct" / "12 Oct 2025" */
function formatActivityDate(value: unknown): string {
  const d = toDate(value);
  if (!d) return "Recently";
  const days = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  const time = timeOnly.format(d).toLowerCase();
  if (days <= 0) return `Today, ${time}`;
  if (days === 1) return `Yesterday, ${time}`;
  if (days < 7) return `${days} days ago`;
  return d.getFullYear() === new Date().getFullYear() ? dayMonth.format(d) : dayMonthYear.format(d);
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
type Activity = {
  id: string;
  date: unknown;
  percentage: number;
  subject: string;
  score: number;
  totalQuestions: number;
};

const categoryNames = {
  senior: "Senior Secondary (JAMB/WAEC)",
  junior: "Junior Secondary (BECE/Common Entrance)",
  professional: "Job Interview & Career",
};

export default function DashboardOverview() {
  const { user, loading: authLoading } = useAuth();

  const [results, setResults] = useState<Activity[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setDataLoading(false);
        return;
      }
      try {
        // Stats are worked out from a bigger set than the five rows shown below.
        const raw = await examService.getTestResults({ limit: 50 });
        setResults(
          raw.map((res: any) => ({
            id: res.id,
            date: res.date ?? res.createdAt ?? res.timestamp,
            percentage: Number(res.percentage ?? 0),
            subject: res.subject || "General Test",
            score: res.score || 0,
            totalQuestions: res.totalQuestions || 0,
          })),
        );
      } catch (error) {
        console.error("Dashboard Fetch Error:", error);
      } finally {
        setDataLoading(false);
      }
    };
    if (!authLoading) fetchDashboardData();
  }, [authLoading, user]);

  const { recent, stats } = useMemo(() => {
    const sorted = [...results].sort(
      (a, b) => (toDate(b.date)?.getTime() ?? 0) - (toDate(a.date)?.getTime() ?? 0),
    );
    const pct = sorted.map((r) => r.percentage);
    return {
      recent: sorted.slice(0, 5),
      stats: {
        totalTests: sorted.length,
        averageScore: pct.length ? Math.round(pct.reduce((a, b) => a + b, 0) / pct.length) : 0,
        bestScore: pct.length ? Math.max(...pct) : 0,
      },
    };
  }, [results]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex h-screen items-center justify-center p-8">
        <Loader2 className="animate-spin text-emerald-600" />
      </div>
    );
  }

  const credits = user?.credits || 0;
  const firstName = (user?.displayName || "Scholar").split(" ")[0];
  const lowCredits = credits < 15;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* 1. Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-slate-900 p-8 text-white shadow-lg md:p-10">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-400/20 blur-3xl" />
        <Trophy
          size={220}
          className="pointer-events-none absolute -bottom-10 -right-6 hidden text-white opacity-5 md:block"
        />

        <div className="relative z-10 max-w-xl">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-emerald-300">
            {greeting()}
          </p>
          <h1 className="mb-3 text-3xl font-bold md:text-4xl">
            Hello, <span className="text-emerald-300">{firstName}</span>
          </h1>
          <p className="mb-7 text-slate-300">
            Practice is free for registered users.{" "}
            You&apos;re preparing for{" "}
            <span className="font-semibold text-white">
              {categoryNames[user?.examCategory as keyof typeof categoryNames] || "your exams"}
            </span>
            .
          </p>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/dashboard/practice"
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
            >
              Enter Practice Centre <ArrowRight size={18} />
            </Link>
            <Link
              href="/dashboard/buy-credits"
              className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Coins size={18} /> Buy Credits
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet size={22} />}
          label="Credit balance"
          value={credits.toLocaleString()}
          subtext={lowCredits ? "Running low" : "Available for exams"}
          color={lowCredits ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"}
        />
        <StatCard
          icon={<Target size={22} />}
          label="Average score"
          value={stats.totalTests ? `${stats.averageScore}%` : "-"}
          subtext={stats.totalTests ? `Across ${stats.totalTests} test${stats.totalTests > 1 ? "s" : ""}` : "No tests yet"}
          color="bg-amber-100 text-amber-600"
        />
        <StatCard
          icon={<Flame size={22} />}
          label="Best score"
          value={stats.totalTests ? `${stats.bestScore}%` : "-"}
          subtext="Your personal high"
          color="bg-rose-100 text-rose-600"
        />
        <StatCard
          icon={<TrendingUp size={22} />}
          label="Tests taken"
          value={stats.totalTests}
          subtext="Lifetime sessions"
          color="bg-blue-100 text-blue-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 3. Recent activity */}
        <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Activity size={20} className="text-slate-400" /> Recent activity
            </h3>
            <Link href="/dashboard/practice" className="text-sm font-semibold text-emerald-600 hover:underline">
              Take a new test
            </Link>
          </div>

          {recent.length > 0 ? (
            <ul className="space-y-3">
              {recent.map((item) => {
                const passed = item.percentage >= 50;
                return (
                  <li key={item.id}>
                    <Link
                      href={`/dashboard/result/${item.id}`}
                      className="group block rounded-xl border border-slate-100 bg-slate-50 p-4 transition hover:border-emerald-200 hover:bg-white hover:shadow-sm"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex min-w-0 items-center gap-4">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                              passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                            }`}
                          >
                            <BookOpen size={18} />
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-800">{item.subject}</span>
                            <span className="text-xs text-slate-500">{formatActivityDate(item.date)}</span>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <span className="hidden text-sm text-slate-500 sm:block">
                            {item.score}/{item.totalQuestions}
                          </span>
                          <span
                            className={`rounded-lg px-3 py-1 font-bold ${
                              passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}
                          >
                            {item.percentage}%
                          </span>
                          <ArrowRight
                            size={16}
                            className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full ${passed ? "bg-emerald-500" : "bg-red-400"}`}
                          style={{ width: `${Math.min(Math.max(item.percentage, 0), 100)}%` }}
                        />
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-12 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="font-medium text-slate-500">No tests taken yet.</p>
              <Link href="/dashboard/practice" className="text-sm font-bold text-emerald-600 hover:underline">
                Start your first test
              </Link>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
            <h4 className="mb-4 font-bold text-slate-900">Jump back in</h4>
            <div className="space-y-2">
              <QuickLink href="/dashboard/practice" icon={<BookOpen size={18} />} title="Subject practice" hint="Pick a subject and topic" />
              <QuickLink href="/dashboard/practice" icon={<Timer size={18} />} title="Full mock exam" hint="JAMB, WAEC or NECO" />
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-emerald-900 to-slate-900 p-6 text-white shadow-lg">
            <div className="mb-4 w-fit rounded-lg bg-white/10 p-2">
              <Zap size={20} className="text-yellow-400" fill="currentColor" />
            </div>
            <h3 className="mb-2 text-lg font-bold">Tip of the day</h3>
            <p className="text-sm leading-relaxed text-slate-300">
              &quot;Consistency beats intensity. It is better to practice for 30 minutes every day than for 5 hours
              once a week.&quot;
            </p>
          </div>

          {lowCredits && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
              <h4 className="mb-2 flex items-center gap-2 font-bold text-amber-900">
                <CreditCard size={18} className="text-amber-600" /> Low on credits
              </h4>
              <p className="mb-4 text-xs text-amber-800">Get a bundle to keep your practice sessions going.</p>
              <Link
                href="/dashboard/buy-credits"
                className="block rounded-lg bg-amber-500 py-2 text-center text-sm font-bold text-white transition hover:bg-amber-600"
              >
                View credit packages
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, title, hint }: { href: string; icon: React.ReactNode; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-emerald-200 hover:bg-emerald-50"
    >
      <span className="rounded-lg bg-emerald-100 p-2 text-emerald-600">{icon}</span>
      <span className="flex-1">
        <span className="block text-sm font-bold text-slate-800">{title}</span>
        <span className="text-xs text-slate-500">{hint}</span>
      </span>
      <ArrowRight size={16} className="text-slate-300 transition group-hover:text-emerald-500" />
    </Link>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  subtext: string;
  color: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className={`shrink-0 rounded-xl p-3 ${color}`}>{icon}</div>
      <div>
        <p className="mb-1 text-sm font-medium text-slate-500">{label}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        <p className="mt-1 text-xs text-slate-400">{subtext}</p>
      </div>
    </div>
  );
}