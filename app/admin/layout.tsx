"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LayoutDashboard, FileText, Users, LogOut, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";


const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim().toLowerCase());

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (loading) return;

  
    if (!user) {
      if (pathname !== "/admin/login") router.push("/admin/login");
      return;
    }

    // 🔍 ROBUST CHECK: Convert everything to lowercase and remove spaces
    const currentUserEmail = user.email?.toLowerCase().trim() || "";
    const allowedAdmins = ADMIN_EMAILS.map(email => email.toLowerCase().trim());

    console.log("Checking Admin Access...");
    console.log("User:", currentUserEmail);
    console.log("Allowed:", allowedAdmins);

    // 2. If logged in but NOT an admin, kick them out
    if (!allowedAdmins.includes(currentUserEmail)) {
      // 🚨 ALERT THE USER WHY THEY FAILED
      alert(`ACCESS DENIED.\n\nYou are logged in as: ${user.email}\n\nBut the Admin list only allows:\n${ADMIN_EMAILS.join("\n")}`);
      
      router.push("/dashboard"); // Send back to student dashboard
      return;
    }

    // 3. Authorized
    setIsAuthorized(true);
  }, [user, loading, pathname, router]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  // Allow the login page to render without the sidebar
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !isAuthorized) {
    return <div className="h-screen flex items-center justify-center bg-slate-900 text-white"><Loader2 className="animate-spin mr-2"/> Verifying Admin Access...</div>;
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Admin Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-white tracking-wide">ADMIN PORTAL</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <NavLink href="/admin/dashboard" icon={<LayoutDashboard size={20}/>} label="Overview" active={pathname === "/admin/dashboard"} />
          <NavLink href="/admin/dashboard/content" icon={<FileText size={20}/>} label="Content Manager" active={pathname.includes("/content")} />
          <div className="px-4 py-3 flex items-center gap-3 text-slate-600 cursor-not-allowed opacity-50">
            <Users size={20} /> Users (Coming Soon)
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 transition w-full">
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

// Helper Component for Sidebar Links
function NavLink({ href, icon, label, active }: any) {
  return (
    <Link 
      href={href} 
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white font-bold shadow-lg' : 'hover:bg-slate-800 hover:text-white'}`}
    >
      {icon} {label}
    </Link>
  );
}