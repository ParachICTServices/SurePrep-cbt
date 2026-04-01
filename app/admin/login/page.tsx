"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockIcon } from "lucide-react";
import { toast } from "sonner";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");

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
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();


if (!response.ok) {
  throw new Error(data.message || "Invalid credentials");
}

const token = data.token || data.accessToken; 

if (token) {
  localStorage.setItem("auth_token", token);
  toast.success("Admin access granted.");
  router.push("/admin/dashboard");
} else {
  toast.error("Auth failed: No token received from server");
}

      const userEmail = data.user?.email?.toLowerCase();
      
      if (userEmail && ADMIN_EMAILS.includes(userEmail)) {
       
        localStorage.setItem("auth_token", data.accessToken);
        toast.success("Admin access granted.");
        router.push("/admin/dashboard");
      } else {
        toast.error("Access Denied: This account is not authorized as an Admin.");
      }
    } catch (error: any) {
      toast.error("Admin Login Failed: " + error.message);
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
              placeholder="admin@Sure Prep.ng"
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