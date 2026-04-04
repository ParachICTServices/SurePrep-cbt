"use client";

import { useState, useRef, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/app/context/AuthContext";
import { apiClient } from "@/app/lib/api/apiClient";
import { authService } from "@/app/lib/api/services/authService";
import { isAdminUser } from "@/app/lib/auth/roles";

const OTP_LENGTH = 6;

function AdminVerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();
  const { refreshUser, user, loading: authLoading } = useAuth();

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) {
      toast.error("Missing email. Start again from admin login.");
      router.replace("/admin/login");
    }
  }, [email, router]);

  useEffect(() => {
    if (authLoading || !user) return;
    if (isAdminUser(user)) {
      router.replace("/admin/dashboard");
    }
  }, [authLoading, user, router]);

  const otp = digits.join("");
  const isComplete = otp.length === OTP_LENGTH && digits.every((d) => d !== "");

  const focusNext = (i: number) => inputRefs.current[i + 1]?.focus();
  const focusPrev = (i: number) => inputRefs.current[i - 1]?.focus();

  const handleChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const updated = [...digits];
    updated[index] = digit;
    setDigits(updated);
    if (digit && index < OTP_LENGTH - 1) focusNext(index);
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[index]) {
        const updated = [...digits];
        updated[index] = "";
        setDigits(updated);
      } else {
        focusPrev(index);
        const updated = [...digits];
        if (index > 0) updated[index - 1] = "";
        setDigits(updated);
      }
    } else if (e.key === "ArrowLeft") focusPrev(index);
    else if (e.key === "ArrowRight") focusNext(index);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill("");
    pasted.split("").forEach((char, i) => {
      updated[i] = char;
    });
    setDigits(updated);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isComplete || !email) return;

    setSubmitting(true);
    try {
      const res = await authService.adminVerifyLoginOtp({ email, otp });
      const token = res.accessToken ?? res.token;
      if (!token) {
        throw new Error("No access token received.");
      }
      localStorage.setItem("auth_token", token);
      apiClient.setToken(token);
      await refreshUser();
      toast.success("Signed in successfully.");
      router.replace("/admin/dashboard");
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Invalid or expired code."
      );
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setSubmitting(false);
    }
  };

  if (!email) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
        <Link
          href={`/admin/login?email=${encodeURIComponent(email)}`}
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to login
        </Link>

        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
            <ShieldCheck className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Enter sign-in code</h1>
          <p className="text-slate-400 text-sm mt-2">
            We sent a {OTP_LENGTH}-digit code to{" "}
            <span className="font-medium text-slate-300">{email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {digits.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={submitting}
                className={`w-11 h-14 sm:w-12 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all bg-slate-900 text-white
                  ${digit ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-slate-600"}
                  focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/30 disabled:opacity-50`}
                aria-label={`Digit ${i + 1}`}
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={!isComplete || submitting}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="animate-spin" /> : "Verify & continue"}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          Didn&apos;t get a code?{" "}
          <Link
            href={`/admin/login?email=${encodeURIComponent(email)}`}
            className="text-emerald-400 hover:text-emerald-300 font-medium"
          >
            Sign in again
          </Link>{" "}
          to resend.
        </p>
      </div>
    </div>
  );
}

export default function AdminVerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <AdminVerifyOtpForm />
    </Suspense>
  );
}
