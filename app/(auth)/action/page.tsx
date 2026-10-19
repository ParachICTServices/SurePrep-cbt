"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";
import { Loader2, Lock, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/app/components/theme-toggle";
import { auth } from "@/app/lib/firebase";

const MIN_PASSWORD_LENGTH = 10;

function getPasswordStrength(password: string) {
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

function friendlyError(code?: string) {
  switch (code) {
    case "auth/expired-action-code":
      return "This reset link has expired. Please request a new one.";
    case "auth/invalid-action-code":
      return "This reset link is invalid or has already been used.";
    case "auth/weak-password":
      return "Please choose a stronger password.";
    default:
      return "Something went wrong. Please try again.";
  }
}

const card =
  "max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800";
const inputCls =
  "w-full px-4 py-3 pr-11 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none";
const primaryBtn =
  "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl transition";

function ActionForm() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = params.get("mode");
  const oobCode = params.get("oobCode") ?? "";

  const [email, setEmail] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      setCodeError("This password reset link is missing or invalid.");
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(setEmail)
      .catch((err: { code?: string }) => setCodeError(friendlyError(err.code)));
  }, [mode, oobCode]);

  const strength = getPasswordStrength(password);
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;
  const passwordsMatch = password === confirmPassword;

  if (!email && !codeError) {
    return (
      <div className={`${card} text-center`}>
        <Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400 mx-auto" size={32} />
        <p className="text-slate-500 dark:text-slate-400 mt-4">Verifying your reset link...</p>
      </div>
    );
  }

  if (codeError) {
    return (
      <div className={`${card} text-center`}>
        <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="text-red-600 dark:text-red-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Invalid Link</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{codeError}</p>
        <button onClick={() => router.push("/login")} className={primaryBtn}>
          Back to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className={`${card} text-center`}>
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Password Reset!</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">
          Your password has been successfully reset.
        </p>
        <button onClick={() => router.push("/login")} className={primaryBtn}>
          Go to Login
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid) return toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
    if (!passwordsMatch) return toast.error("Passwords don't match");

    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      toast.success("Password reset successful!");
    } catch (err) {
      toast.error(friendlyError((err as { code?: string }).code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={card}>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lock className="text-emerald-600 dark:text-emerald-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Reset Password</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          Enter a new password for <span className="font-medium">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
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
                      strength.score >= level ? strength.color : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Strength: <span className="font-medium">{strength.label}</span>
                {!isPasswordValid && <span> — minimum {MIN_PASSWORD_LENGTH} characters</span>}
              </p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={inputCls}
              placeholder="••••••••"
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowConfirm((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {confirmPassword.length > 0 && !passwordsMatch && (
            <p className="text-sm text-red-600 mt-1">Passwords don&apos;t match</p>
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

export default function AuthActionPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Suspense fallback={<Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={32} />}>
        <ActionForm />
      </Suspense>
    </div>
  );
}