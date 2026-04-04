"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LockIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { isAdminUser } from "@/app/lib/auth/roles";
import { authService } from "@/app/lib/api/services/authService";
import { ThemeToggle } from "@/app/components/theme-toggle";

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    const q = searchParams.get("email");
    if (q) setEmail(q);
  }, [searchParams]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (isAdminUser(user)) {
      router.replace("/admin/dashboard");
    } else {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await authService.adminLogin({ email, password });
      toast.success(
        res.message ||
          "Check your email for a 6-digit code to finish signing in."
      );
      router.push(
        `/admin/login/verify-otp?email=${encodeURIComponent(email.trim())}`
      );
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Admin login failed."
      );
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 text-slate-500 dark:text-slate-400">
        {authLoading ? "Loading..." : "Redirecting..."}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-8">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-xl dark:shadow-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-200 dark:border-slate-600">
            <LockIcon className="text-emerald-600 dark:text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Admin Restricted Area</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-2">
            Sign in — we&apos;ll email you a one-time code.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Continue"}
          </button>
        </form>

        <p className="text-center text-slate-500 dark:text-slate-500 text-xs mt-6">
          System activity is monitored and logged.
        </p>
      </div>
    </div>
  );
}

export default function AdminLogin() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 text-slate-500">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
