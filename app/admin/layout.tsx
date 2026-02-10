"use client";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loader2, LayoutDashboard, FileText, Users, LogOut, ShieldCheck, Menu, X, BookOpen, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { toast } from "sonner";

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
  .split(",")
  .map(email => email.trim().toLowerCase());

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      toast.error(`ACCESS DENIED.\n\nYou are logged in as: ${user.email}\n\nBut the Admin list only allows:\n${ADMIN_EMAILS.join("\n")}`);
      
      router.push("/dashboard");
      return;
    }

    // 3. Authorized
    setIsAuthorized(true);
  }, [user, loading, pathname, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/admin/login");
  };

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  if (loading || !isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-900 text-white">
        <Loader2 className="animate-spin mr-2" /> Verifying Admin Access...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-30 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold tracking-wide text-sm">ADMIN PORTAL</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-800 rounded-lg transition"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30 mt-16"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside
        className={`
          w-64 bg-slate-900 text-slate-300 flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          mt-16 lg:mt-0
        `}
      >
        {/* Desktop Header */}
        <div className="hidden lg:flex p-6 border-b border-slate-800 items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <ShieldCheck size={20} />
          </div>
          <span className="font-bold text-white tracking-wide">ADMIN PORTAL</span>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <NavLink
            href="/admin/dashboard"
            icon={<LayoutDashboard size={20} />}
            label="Overview"
            active={pathname === "/admin/dashboard"}
          />
          <NavLink
            href="/admin/dashboard/content"
            icon={<FileText size={20} />}
            label="Content Manager"
            active={pathname.includes("/content")}
          />
           <NavLink href="/admin/dashboard/questions" icon={<BookOpen size={20}/>} label="Question Bank" active={pathname.includes("/questions")} />
             <NavLink href="/admin/dashboard/subjects" icon={<LayoutGrid size={20}/>} label="Manage Subjects" active={pathname.includes("/subjects")} />

          <div className="px-4 py-3 flex items-center gap-3 text-slate-600 cursor-not-allowed opacity-50">
            <Users size={20} /> <span className="text-sm">Users (Coming Soon)</span>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-800 rounded-xl transition w-full"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 overflow-y-auto mt-16 lg:mt-0">
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? "bg-emerald-600 text-white font-bold shadow-lg"
          : "hover:bg-slate-800 hover:text-white"
      }`}
    >
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
}