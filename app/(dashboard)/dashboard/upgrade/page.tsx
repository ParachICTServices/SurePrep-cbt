"use client";
import { useState } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { db } from "@/app/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { CheckCircle, Zap, Shield, Star, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export default function UpgradePage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Configuration
  const PRICE = 2000; // Naira
  const PAYSTACK_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;

  const handlePayment = async () => {
    if (!user) return;
    setLoading(true);

    if (!PAYSTACK_KEY) {
      toast.error("Paystack Key not found in .env.local");
      setLoading(false);
      return;
    }

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: PAYSTACK_KEY,
        email: user.email!,
        amount: PRICE * 100,
        currency: 'NGN',
        reference: "" + Math.floor((Math.random() * 1000000000) + 1),
        onSuccess: async (transaction: any) => {
          try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
              subscriptionStatus: 'premium',
              subscriptionDate: new Date().toISOString(),
              paymentRef: transaction.reference
            });
            
            toast.success("Payment Successful! Welcome to Premium.");
            window.location.href = "/dashboard";
          } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Payment received but error updating profile. Contact support.");
          }
        },
        onCancel: () => {
          setLoading(false);
          toast.error("Transaction Cancelled");
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error initializing payment. Please try again.");
      setLoading(false);
    }
  };

  if (userData?.subscriptionStatus === 'premium') {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="bg-emerald-50 border border-emerald-100 p-12 rounded-3xl">
          <div className="h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Star size={40} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">You are a Premium Member!</h1>
          <p className="text-emerald-700 mb-8">Thank you for subscribing. You have unlimited access.</p>
          <button onClick={() => router.push('/dashboard/practice')} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold">
            Go to Practice Centre
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">
          Unlock Your Full Potential
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          Join hundreds of students scoring 300+ in JAMB. Get unlimited access to past questions, detailed solutions, and analytics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        
        {/* Free Plan */}
        <div className="p-8 rounded-3xl border border-slate-200 bg-white text-slate-500">
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Free Plan</h3>
          <p className="mb-6">Good for testing the platform.</p>
          <div className="text-4xl font-bold text-slate-900 mb-8">₦0</div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 items-center"><CheckCircle size={20} className="text-emerald-500"/> Access to 2010-2015 Questions</li>
            <li className="flex gap-3 items-center"><CheckCircle size={20} className="text-emerald-500"/> Basic Practice Mode</li>
            <li className="flex gap-3 items-center opacity-50"><Lock size={20}/> No Detailed Explanations</li>
            <li className="flex gap-3 items-center opacity-50"><Lock size={20}/> No Performance Analytics</li>
            <li className="flex gap-3 items-center opacity-50"><Lock size={20}/> No Mock Exams</li>
          </ul>
          
          <button disabled className="w-full py-4 rounded-xl font-bold bg-slate-100 text-slate-400">
            Current Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div className="relative p-8 rounded-3xl border-2 border-emerald-500 bg-emerald-50/50 text-slate-800 shadow-xl">
          <div className="absolute top-0 right-0 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">
            RECOMMENDED
          </div>
          
          <h3 className="text-2xl font-bold text-emerald-900 mb-2">Premium Access</h3>
          <p className="mb-6 text-emerald-800/80">Everything you need to succeed.</p>
          <div className="flex items-baseline gap-1 mb-8">
            <span className="text-5xl font-extrabold text-emerald-600">₦2,000</span>
            <span className="text-slate-500">/ one-time</span>
          </div>
          
          <ul className="space-y-4 mb-8">
            <li className="flex gap-3 items-center font-medium"><Zap size={20} className="text-emerald-600" fill="currentColor"/> Access All Years (1978-Date)</li>
            <li className="flex gap-3 items-center font-medium"><Shield size={20} className="text-emerald-600"/> Detailed Step-by-Step Solutions</li>
            <li className="flex gap-3 items-center font-medium"><Star size={20} className="text-emerald-600"/> Mock Exam Mode (Timed)</li>
            <li className="flex gap-3 items-center font-medium"><CheckCircle size={20} className="text-emerald-600"/> Performance Analytics</li>
            <li className="flex gap-3 items-center font-medium"><CheckCircle size={20} className="text-emerald-600"/> Priority Support</li>
          </ul>
          
          <button 
            onClick={handlePayment}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all transform hover:-translate-y-1"
          >
            {loading ? "Processing..." : "Upgrade Now - ₦2,000"}
          </button>
          <p className="text-xs text-center mt-4 text-emerald-700/60">Secured by Paystack</p>
        </div>

      </div>
    </div>
  );
}