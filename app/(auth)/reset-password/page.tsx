"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Mail, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/app/components/theme-toggle";

const card =
  "max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {sent ? (
        <div className={`${card} text-center`}>
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Check your email</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            If an account exists for <span className="font-medium">{email}</span>, we&apos;ve sent a reset link. It expires in 1 hour.
          </p>
          <Link
            href="/login"
            className="block w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
          >
            Back to Login
          </Link>
        </div>
      ) : (
        <div className={card}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="text-emerald-600 dark:text-emerald-400" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Forgot password?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
              Enter your email and we&apos;ll send you a reset link.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
            <button
              type="submit"
              disabled={loading || !email}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="animate-spin" size={18} />}
              {loading ? "Sending..." : "Send reset link"}
            </button>
            <Link
              href="/login"
              className="block text-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              Back to login
            </Link>
          </form>
        </div>
      )}
    </div>
  );
}