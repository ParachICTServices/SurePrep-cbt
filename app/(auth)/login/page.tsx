"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

export default function Login() {
  const router = useRouter();
const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      toast.success("Login successful! Welcome back.");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to send reset code");
      }

      setResetEmailSent(true);
      toast.success("Reset code sent to your email!");
      router.push(`/reset-password/verify-otp?email=${encodeURIComponent(resetEmail)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send reset code"); 
    } finally {
      setResetLoading(false);
    }
  };

  const handleBackToForgotPassword = () => {
    setResetEmailSent(false);
    setResetEmail("");
  };

  const handleBackToLogin = () => {
    setShowForgotPassword(false);
    setResetEmailSent(false);
    setResetEmail("");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            {showForgotPassword
              ? resetEmailSent
                ? "Verify Reset"
                : "Forgot Password"
              : "Welcome Back"}
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {showForgotPassword
              ? resetEmailSent
                ? "Check your inbox for the security code"
                : "Enter your email to receive a reset code"
              : "Continue your CBT preparation 🚀"}
          </p>
        </div>

        {/* Animated Error */}
        <AnimatePresence>
          {error && !showForgotPassword && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4 rounded-lg bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-200"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {showForgotPassword ? (
            resetEmailSent ? (
              <motion.div
                key="email-sent"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="text-blue-600" size={32} />
                </div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
                  <p className="text-sm text-slate-700 mb-2 font-medium">Reset Code Sent to:</p>
                  <p className="font-bold text-slate-900 mb-6 break-all">{resetEmail}</p>

                  <Link
                    href={`/reset-password/verify-otp?email=${encodeURIComponent(resetEmail)}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-blue-100 mb-4"
                  >
                    Enter Reset Code
                  </Link>
                </div>

                <button
                  onClick={handleBackToLogin}
                  className="text-sm text-slate-500 hover:text-slate-800 font-medium transition"
                >
                  Back to Login
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="forgot-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onSubmit={handlePasswordReset}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      size={18}
                    />
                    <input
                      type="email"
                      required
                      disabled={resetLoading}
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={resetLoading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <Loader2 className="animate-spin" size={18} /> : "Send Code"}
                  </button>
                </div>
              </motion.form>
            )
          ) : (
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                <input
                  type="email"
                  required
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    disabled={loading}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none pr-12 disabled:bg-slate-100"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-6"
              >
                {loading ? <Loader2 className="animate-spin" size={18} /> : "Login"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {!showForgotPassword && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-6 text-center text-sm text-slate-600"
          >
            No account?{" "}
            <Link href="/register" className="text-emerald-600 font-semibold hover:underline">
              Register
            </Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}