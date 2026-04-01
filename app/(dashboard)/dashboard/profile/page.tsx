"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { User as UserIcon, Mail, CreditCard, LogOut, Shield, GraduationCap, School, Briefcase, Settings, Coins, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function ProfilePage() {
  const { user, logout, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    
    try {
      const dateObj = new Date(dateString);
      if (isNaN(dateObj.getTime())) return "N/A";
      
      return dateObj.toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return "N/A";
    }
  };

  const getExamCategoryInfo = () => {
    const category = user?.examCategory || 'senior';
    
    const categoryMap = {
      'senior': { label: 'Senior Secondary (SS1-SS3)', icon: GraduationCap, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      'junior': { label: 'Junior Secondary (JSS1-JSS3)', icon: School, color: 'text-blue-600', bg: 'bg-blue-50' },
      'professional': { label: 'Job Interview & Career', icon: Briefcase, color: 'text-purple-600', bg: 'bg-purple-50' }
    };

    return categoryMap[category as keyof typeof categoryMap] || categoryMap.senior;
  };

  const examCategoryInfo = getExamCategoryInfo();
  const ExamIcon = examCategoryInfo.icon;

  if (loading) return <div className="p-10 flex justify-center text-slate-500">Loading Profile...</div>;

  const userCredits = user?.credits || 0;
  const totalCreditsEarned = user?.totalCreditsEarned || 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-slate-900">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Left Column: User Details */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Personal Info Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <UserIcon size={20} className="text-emerald-600"/> Personal Information
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-slate-400 shadow-sm">
                  <UserIcon size={20} />
                </div>
                <div>
                  <p className="text-xs text-slate-500 uppercase font-bold">Display Name</p>
                  <p className="font-medium text-slate-900">{user?.displayName || "Student"}</p>
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

              {/* Exam Category Display */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className={`h-10 w-10 ${examCategoryInfo.bg} rounded-full flex items-center justify-center shadow-sm`}>
                  <ExamIcon size={20} className={examCategoryInfo.color} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-slate-500 uppercase font-bold">Exam Category</p>
                  <p className={`font-medium ${examCategoryInfo.color}`}>{examCategoryInfo.label}</p>
                </div>
                <Link 
                  href="/dashboard/settings" 
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 hover:underline"
                >
                  <Settings size={14} />
                  Change
                </Link>
              </div>
            </div>
          </div>

          {/* Credits Card */}
          <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-2xl text-white shadow-xl">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2">
              <Coins size={20} className="text-emerald-300"/> Credit Balance
            </h2>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-200 text-sm mb-1">Current Balance</p>
                <div className="flex items-center gap-2">
                  <Coins size={24} className="text-emerald-300" />
                  <p className="text-3xl font-bold">{userCredits.toLocaleString()}</p>
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <p className="text-emerald-200 text-sm mb-1 flex items-center gap-1">
                  <TrendingUp size={14} />
                  Total Earned
                </p>
                <p className="text-3xl font-bold">{totalCreditsEarned.toLocaleString()}</p>
              </div>
            </div>

            <Link
              href="/dashboard/buy-credits"
              className="mt-6 w-full bg-white hover:bg-emerald-50 text-emerald-700 font-bold py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              <Coins size={20} />
              Buy More Credits
            </Link>
          </div>

          {/* Subscription Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
             <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <CreditCard size={20} className="text-emerald-600"/> Subscription Plan
            </h2>

            <div className="p-6 rounded-xl border bg-slate-50 border-slate-200">
               <div className="flex justify-between items-start">
                 <div>
                   <p className="text-sm text-slate-500 mb-1">Current Plan</p>
                   <h3 className="text-2xl font-bold text-slate-700">
                     Credit-Based
                   </h3>
                 </div>
                 <Shield className="text-slate-400" size={32} />
               </div>

               <div className="mt-4 text-sm text-slate-600">
                 <p>Purchase credits to unlock practice sessions and mock exams. Your credits never expire.</p>
               </div>
            </div>
          </div>

        </div>

        {/* Right Column: Account Actions */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
              <h2 className="text-lg font-bold text-slate-800 mb-6">Account Actions</h2>
              
              <div className="space-y-3">
                <Link 
                  href="/dashboard/settings"
                  className="w-full flex items-center gap-3 p-4 text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition font-medium"
                >
                  <Settings size={20} />
                  Settings
                </Link>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-4 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition font-medium"
                >
                  <LogOut size={20} />
                  Sign Out
                </button>
              </div>

              <p className="text-xs text-slate-400 mt-6 text-center">
                Member since {formatDate(user?.createdAt)}
              </p>
           </div>
        </div>

      </div>
    </div>
  );
}