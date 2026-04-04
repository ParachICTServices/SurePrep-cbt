"use client";

import { useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/app/components/theme-toggle";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
const OTP_LENGTH = 6;

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [resendLoading, setResendLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const otp = digits.join("");
  const isComplete = digits.every((d) => d !== "");

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
    pasted.split("").forEach((char, i) => { updated[i] = char; });
    setDigits(updated);
    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleContinue = () => {
    if (!isComplete) return;
    router.push(
      `/reset-password?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`
    );
  };

  const handleResend = async () => {
    if (cooldown > 0 || !email || !API_BASE_URL) return;
    setResendLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to resend code");
      }
      toast.success("A new code has been sent to your email.");
      setDigits(Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();
      setCooldown(60);
      cooldownRef.current = setInterval(() => {
        setCooldown((c) => {
          if (c <= 1) { clearInterval(cooldownRef.current!); return 0; }
          return c - 1;
        });
      }, 1000);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend code");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-slate-100 dark:border-slate-800">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="text-emerald-600 dark:text-emerald-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Check your email</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">
          We sent a {OTP_LENGTH}-digit code to{" "}
          <span className="font-medium text-slate-700 dark:text-slate-200">{email}</span>
        </p>
      </div>

      <div className="flex justify-center gap-3 mb-6">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={handlePaste}
            className={`w-12 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-all bg-white dark:bg-slate-950
              ${digit ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300" : "border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white"}
              focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 dark:focus:ring-emerald-900/50`}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={handleContinue}
        disabled={!isComplete}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition mb-4"
      >
        Continue
      </button>

      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        Didn't receive a code?{" "}
        {cooldown > 0 ? (
          <span className="text-slate-400 dark:text-slate-500">Resend in {cooldown}s</span>
        ) : (
          <button
            onClick={handleResend}
            disabled={resendLoading}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium inline-flex items-center gap-1 disabled:opacity-50"
          >
            {resendLoading && <RefreshCw className="animate-spin" size={13} />}
            {resendLoading ? "Sending..." : "Resend code"}
          </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4 py-8">
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>
      <Suspense fallback={<Loader2 className="animate-spin text-emerald-600 dark:text-emerald-400" size={32} />}>
        <VerifyOtpForm />
      </Suspense>
    </div>
  );
}