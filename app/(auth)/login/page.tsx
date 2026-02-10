"use client";

import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, Mail, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

export default function Login() {
  const router = useRouter();

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
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: any) {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetLoading(true);

    try {
    
      await sendPasswordResetEmail(auth, resetEmail, {
        url: `${window.location.origin}/login`, 
        handleCodeInApp: false,
      });
      
      setResetEmailSent(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email address");
      } else {
        toast.error("Failed to send reset email. Please try again.");
      }
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
              ? (resetEmailSent ? "Check Your Email" : "Reset Password")
              : "Welcome Back"
            }
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            {showForgotPassword 
              ? (resetEmailSent 
                  ? "We've sent you a reset link" 
                  : "Enter your email to receive a reset link"
                )
              : "Continue your CBT preparation 🚀"
            }
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <CheckCircle2 className="text-emerald-600" size={32} />
                </motion.div>

                <div className="bg-slate-50 rounded-lg p-6 mb-6 border border-slate-200">
                  <p className="text-sm text-slate-700 mb-4">
                    We've sent a password reset email to:
                  </p>
                  <p className="font-semibold text-slate-900 mb-6 break-all">
                    {resetEmail}
                  </p>
                  
                  <div className="space-y-3 text-left text-sm text-slate-600">
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 font-bold text-xs">1</span>
                      </div>
                      <p>Check your email inbox (and spam folder)</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 font-bold text-xs">2</span>
                      </div>
                      <p>Click the <strong className="text-slate-900">"Reset Password"</strong> button in the email</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-emerald-600 font-bold text-xs">3</span>
                      </div>
                      <p>Create your new password on the secure page</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
                  >
                    Back to Login
                  </button>
                  <button
                    onClick={handleBackToForgotPassword}
                    className="w-full text-sm text-slate-600 hover:text-emerald-600 font-medium transition"
                  >
                    Didn't receive it? Try again
                  </button>
                </div>
              </motion.div>
            ) : (
              // FORGOT PASSWORD FORM
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
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
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
                  <p className="mt-2 text-xs text-slate-500">
                    You'll receive an email with a button to reset your password
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    disabled={resetLoading}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:bg-slate-50 text-slate-700 font-semibold py-3 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    {resetLoading && <Loader2 className="animate-spin" size={18} />}
                    {resetLoading ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </motion.form>
            )
          ) : (
            // LOGIN FORM
            <motion.form
              key="login"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleLogin}
              className="space-y-4"
            >
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
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

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
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

              {/* Button */}
              <button
                disabled={loading}
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2 mt-6"
              >
                {loading && <Loader2 className="animate-spin" size={18} />}
                {loading ? "Signing in..." : "Login"}
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
            <Link
              href="/register"
              className="text-emerald-600 font-semibold hover:underline"
            >
              Register
            </Link>
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}