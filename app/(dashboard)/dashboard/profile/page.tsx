"use client";
import { useAuth } from "@/app/context/AuthContext";
import { auth } from "@/app/lib/firebase";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { User, Mail, CreditCard, Calendar, LogOut, Shield, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  const formatDate = (date: any) => {
    if (!date) return "N/A";
    
    try {
      if (date && typeof date === 'object' && 'seconds' in date) {
        return new Date(date.seconds * 1000).toLocaleDateString('en-NG', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }

      const dateObj = new Date(date);
      if (isNaN(dateObj.getTime())) return "N/A";
      
      return dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error("Date formatting error:", error);
      return "N/A";
    }
  };

  if (loading) return <div className="p-10 flex justify-center">Loading Profile...</div>;

  const isPremium = userData?.subscriptionStatus === 'premium';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: User Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User size={20} className="text-emerald-600"/> Personal Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Display Name</p>
                  <p className="font-medium text-slate-900">{userData?.displayName || "Student"}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Email Address</p>
                  <p className="font-medium text-slate-900">{user?.email || "N/A"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-600"/> Subscription Plan
            </h2>

            <div className={`p-6 rounded-xl border ${isPremium ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                   <h3 className={`text-2xl font-bold ${isPremium ? 'text-emerald-700' : 'text-slate-700'}`}>
                     {isPremium ? "Premium Scholar" : "Free Starter"}
                   </h3>
                 </div>
                 {isPremium && <Shield className="text-emerald-600" size={32} />}
               </div>

               {isPremium ? (
                 <div className="mt-6 flex items-center gap-2 text-emerald-800 text-sm">
                   <CheckCircle size={16} /> Active until: <strong>Lifetime Access</strong>
                 </div>
               ) : (
                 <div className="mt-6">
                   <Link href="/dashboard/upgrade" className="block w-full text-center py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition">
                     Upgrade to Premium (₦2,000)
                   </Link>
                 </div>
               )}
            </div>
          </div>

        </div>

        {/* Right Column: Account Actions */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Account Actions</h2>
              
              <button 
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition font-medium"
              >
                <LogOut size={20} />
                Sign Out
              </button>

              <p className="text-xs text-slate-400 mt-6 text-center">
                Member since {formatDate(user?.metadata?.creationTime)}
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}