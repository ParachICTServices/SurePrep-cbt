"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth, db } from "@/app/lib/firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, CheckCircle, Zap, Shield, Star, Lock } from "lucide-react";
import { toast } from "sonner";

export default function RegisterOnboarding() {
  const [step, setStep] = useState<'register' | 'plan'>('register');
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [createdUser, setCreatedUser] = useState<any>(null);
  
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Display Name
      await updateProfile(user, { displayName: name });

      // 3. Create User Document (Default to Free)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        subscriptionStatus: "free",
        createdAt: new Date().toISOString(),
      });

      setCreatedUser(user);
      setLoading(false);
      setStep('plan'); // 🚀 Move to Plan Selection instead of Dashboard

    } catch (error: any) {
      toast.error(error.message);
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!createdUser) return;
    setLoading(true);

    try {
      const PaystackPop = (await import("@paystack/inline-js")).default;
      const paystack = new PaystackPop();
      paystack.newTransaction({
        key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY as string,
        email: createdUser.email,
        amount: 2000 * 100,
        currency: 'NGN',
        metadata: { custom_fields: [{ display_name: "User ID", variable_name: "user_id", value: createdUser.uid }] },
        onSuccess: async (transaction: any) => {
          try {
            await updateDoc(doc(db, "users", createdUser.uid), {
              subscriptionStatus: 'premium',
              subscriptionExpiry: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 Year
              paymentRef: transaction.reference
            });
            
            // ⚠️ FIX: Force a hard reload so the AuthContext fetches the new Premium status
            window.location.href = "/dashboard"; 
            
          } catch (error) {
            console.error("Error updating profile", error);
            toast.error("Payment successful but error updating profile. Please contact support.");
            setLoading(false);
          }
        },
        onCancel: () => {
          setLoading(false);
          toast.error("Transaction Cancelled.");
        }
      });
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Error initializing payment. Please try again.");
      setLoading(false);
    }
  };

  const handleFreePlan = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-12">
      <div className="max-w-4xl w-full">
        
        {/* Progress Bar */}
        <div className="flex justify-center mb-8 gap-4">
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'register' ? 'bg-emerald-600' : 'bg-emerald-200'}`}></div>
          <div className={`h-2 w-12 rounded-full transition-colors ${step === 'plan' ? 'bg-emerald-600' : 'bg-slate-200'}`}></div>
        </div>

        {/* --- STEP 1: REGISTRATION FORM --- */}
        {step === 'register' && (
          <div className="max-w-md mx-auto bg-white rounded-3xl shadow-xl p-8 border border-slate-100 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-900">Create your Account</h2>
              <p className="text-slate-500 text-sm">Join thousands of students acing JAMB.</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="Chinedu Okeke"
                  value={name} onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                <input 
                  type="email" required 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="student@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input 
                  type="password" required 
                  className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit" disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition flex items-center justify-center shadow-lg shadow-emerald-200"
              >
                {loading ? <Loader2 className="animate-spin" /> : "Continue to Next Step"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-slate-600">
              Already have an account? <Link href="/login" className="text-emerald-600 font-bold hover:underline">Log in</Link>
            </p>
          </div>
        )}

        {/* --- STEP 2: PLAN SELECTION --- */}
        {step === 'plan' && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-slate-900">Welcome, {name.split(' ')[0]}! 🎉</h2>
              <p className="text-slate-500">Choose how you want to prepare for your exams.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Option A: Free */}
              <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 hover:border-slate-300 transition cursor-pointer" onClick={handleFreePlan}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-slate-700">Basic Starter</h3>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-bold">Free</span>
                </div>
                <ul className="space-y-3 mb-8 text-sm text-slate-500">
                  <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500"/> Access 2010-2015 Questions</li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-500"/> Basic Practice Mode</li>
                  <li className="flex gap-2 opacity-50"><Lock size={16}/> No Explanations</li>
                  <li className="flex gap-2 opacity-50"><Lock size={16}/> No Mock Exams</li>
                </ul>
                <button className="w-full py-3 rounded-xl font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                  Skip for Now
                </button>
              </div>

              {/* Option B: Premium */}
              <div className="bg-emerald-900 p-8 rounded-3xl border-2 border-emerald-500 text-white relative shadow-2xl transform scale-105">
                <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-2xl uppercase">
                  Best Value
                </div>
                
                <div className="flex justify-between items-end mb-4">
                  <div>
                     <h3 className="text-xl font-bold text-white">Premium Scholar</h3>
                     <p className="text-emerald-200 text-xs">Unlock your full potential</p>
                  </div>
                  <div className="text-right">
                    <span className="text-3xl font-bold">₦2,000</span>
                  </div>
                </div>
                
                <ul className="space-y-3 mb-8 text-sm text-emerald-100">
                  <li className="flex gap-2"><Zap size={16} className="text-emerald-400" fill="currentColor"/> <strong>Full Access (1978-Date)</strong></li>
                  <li className="flex gap-2"><Shield size={16} className="text-emerald-400"/> <strong>Detailed Solutions</strong></li>
                  <li className="flex gap-2"><Star size={16} className="text-emerald-400"/> <strong>Full Mock Exams</strong></li>
                  <li className="flex gap-2"><CheckCircle size={16} className="text-emerald-400"/> <strong>Performance Analytics</strong></li>
                </ul>

                <button 
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full py-4 rounded-xl font-bold bg-emerald-500 text-white hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/50 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" /> : "Pay & Unlock Access"}
                </button>
                <p className="text-[10px] text-center mt-3 text-emerald-400 opacity-70">Secured by Paystack</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}