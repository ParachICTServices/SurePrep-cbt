"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Lock, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const MIN_PASSWORD_LENGTH = 10;

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= MIN_PASSWORD_LENGTH) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  score = Math.min(score, 4);
  const levels = [
    { label: "Too weak", color: "bg-red-500" },
    { label: "Weak", color: "bg-orange-400" },
    { label: "Fair", color: "bg-yellow-400" },
    { label: "Good", color: "bg-emerald-400" },
    { label: "Strong", color: "bg-emerald-600" },
  ];
  return { score, ...levels[score] };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") ?? "";
  const otp = searchParams.get("otp") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = password === confirmPassword;

  if (!email || !otp) {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h2>
        <p className="text-slate-500 mb-6">
          Something went wrong. Please restart the password reset process.
        </p>
        <button
          onClick={() => router.push("/forgot-password")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
        >
          Start Over
        </button>
      </div>
    );
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!API_BASE_URL) {
      toast.error("Application configuration error.");
      return;
    }
    if (!isPasswordValid) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
      return;
    }
    if (!passwordsMatch) {
      toast.error("Passwords don't match");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, newPassword: password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const code = data.code as string | undefined;
        if (code === "OTP_EXPIRED" || data.message?.toLowerCase().includes("expired")) {
          toast.error("Your reset code has expired. Please request a new one.");
          router.push("/forgot-password");
          return;
        }
        if (code === "OTP_INVALID" || data.message?.toLowerCase().includes("invalid")) {
          toast.error("Invalid reset code. Please try again.");
          router.back();
          return;
        }
        throw new Error(data.message || "Password reset failed");
      }

      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-emerald-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Password Reset!</h2>
        <p className="text-slate-500 mb-6">
          Your password has been successfully reset.
        </p>
        <button
          onClick={() => router.push("/login")}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-emerald-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Reset Password</h2>
        <p className="text-slate-500 text-sm mt-2">Enter your new password</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-4">
        {/* New Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {password.length > 0 && (
            <div className="mt-2 space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      strength.score >= level ? strength.color : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500">
                Strength:{" "}
                <span className={`font-medium ${
                  strength.score <= 1 ? "text-red-500" : strength.score <= 2 ? "text-yellow-500" : "text-emerald-600"
                }`}>
                  {strength.label}
                </span>
                {!isPasswordValid && (
                  <span className="text-slate-400"> — minimum {MIN_PASSWORD_LENGTH} characters</span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-sm text-red-600 mt-1">Passwords don't match</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || !isPasswordValid || !passwordsMatch || !confirmPassword}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition flex items-center justify-center gap-2"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <Suspense fallback={<Loader2 className="animate-spin text-emerald-600" size={32} />}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}