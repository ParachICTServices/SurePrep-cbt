"use client";

import { useState } from "react";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Eye, EyeOff, CheckCircle2, Lock } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import React from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oobCode = searchParams.get("oobCode"); 

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password strength validation
  const getPasswordStrength = (pwd: string) => {
    if (pwd.length === 0) return { strength: 0, label: "", color: "" };
    if (pwd.length < 6) return { strength: 1, label: "Weak", color: "bg-red-500" };
    if (pwd.length < 10) return { strength: 2, label: "Fair", color: "bg-amber-500" };
    if (pwd.length >= 10 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) 
      return { strength: 3, label: "Strong", color: "bg-emerald-500" };
    return { strength: 2, label: "Good", color: "bg-blue-500" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!oobCode) {
      setError("Invalid or expired reset link");
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      setSuccess(true);
      toast.success("Password reset successful!");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      if (err.code === "auth/invalid-action-code") {
        setError("This reset link has expired or already been used");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please choose a stronger password");
      } else {
        setError("Failed to reset password. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!oobCode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Reset Link</h1>
          <p className="text-slate-600 mb-6">
            This password reset link is invalid or has expired. Please request a new one.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100 text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="text-emerald-600" size={48} />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Password Reset Complete!</h1>
          <p className="text-slate-600 mb-6">
            Your password has been successfully updated. Redirecting to login...
          </p>
          <div className="flex items-center justify-center gap-2 text-emerald-600">
            <Loader2 className="animate-spin" size={20} />
            <span className="text-sm font-medium">Redirecting...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-emerald-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Create New Password
          </h1>
          <p className="text-slate-500 text-sm mt-2">
            Choose a strong password for your account
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-lg bg-red-50 text-red-600 text-sm px-4 py-3 border border-red-200"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleResetPassword} className="space-y-5">
          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showNewPassword ? "text" : "password"}
                required
                disabled={loading}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none disabled:bg-slate-100 transition"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Strength Indicator */}
            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-2"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-slate-600">Password Strength</span>
                  <span className={`text-xs font-semibold ${passwordStrength.strength === 3 ? 'text-emerald-600' : passwordStrength.strength === 2 ? 'text-blue-600' : 'text-red-600'}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="flex gap-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        level <= passwordStrength.strength
                          ? passwordStrength.color
                          : "bg-slate-200"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type={showConfirmPassword ? "text" : "password"}
                required
                disabled={loading}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full pl-10 pr-12 py-3 rounded-lg border transition outline-none disabled:bg-slate-100
                  ${confirmPassword && newPassword !== confirmPassword
                    ? 'border-red-300 focus:ring-2 focus:ring-red-500 focus:border-red-500'
                    : 'border-slate-300 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500'
                  }
                `}
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Password Match Indicator */}
            {confirmPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-2"
              >
                {newPassword === confirmPassword ? (
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    Passwords match
                  </p>
                ) : (
                  <p className="text-xs text-red-600">
                    Passwords do not match
                  </p>
                )}
              </motion.div>
            )}
          </div>

          {/* Password Requirements */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <p className="text-xs font-semibold text-slate-700 mb-2">Password must contain:</p>
            <ul className="space-y-1 text-xs text-slate-600">
              <li className={`flex items-center gap-2 ${newPassword.length >= 6 ? 'text-emerald-600' : ''}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${newPassword.length >= 6 ? 'bg-emerald-600' : 'bg-slate-300'}`} />
                At least 6 characters
              </li>
              <li className="flex items-center gap-2 text-slate-500">
                <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                Recommended: uppercase, lowercase & numbers
              </li>
            </ul>
          </div>

          {/* Submit Button */}
          <button
            disabled={loading || newPassword !== confirmPassword || newPassword.length < 6}
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:shadow-none"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {loading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => router.push("/login")}
            className="text-sm text-slate-600 hover:text-emerald-600 font-medium transition"
          >
            ← Back to Login
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-emerald-600" size={48} /></div>}>
      <ResetPasswordContent />
    </React.Suspense>
  );
}