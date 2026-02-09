"use client";
import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter } from "next/navigation";
import { Loader2, LockIcon } from "lucide-react";


const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim().toLowerCase());

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Authenticate
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Authorization Check
      if (ADMIN_EMAILS.includes(user.email!)) {
        router.push("/admin/dashboard");
      } else {
        alert("Access Denied: This account is not an Admin.");
        await auth.signOut(); // Kick them out immediately
      }
    } catch (error: any) {
      alert("Admin Login Failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
      <div className="w-full max-w-md bg-slate-800 rounded-2xl border border-slate-700 p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="h-16 w-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-600">
            <LockIcon className="text-emerald-500" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Restricted Area</h1>
          <p className="text-slate-400 text-sm mt-2">Authorized personnel only.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Admin Email</label>
            <input 
              type="email" 
              required
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="admin@parach.ng"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Password</label>
            <input 
              type="password" 
              required
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition"
              placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center shadow-lg shadow-emerald-900/20"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Authenticate Access"}
          </button>
        </form>

        <p className="text-center text-slate-500 text-xs mt-6">
          System activity is monitored and logged.
        </p>
      </div>
    </div>
  );
}