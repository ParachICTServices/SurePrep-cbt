"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Loader2,
  LayoutDashboard,
  FileText,
  Users,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  BookOpen,
  LayoutGrid,
  Package,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { isAdminUser } from "@/app/lib/auth/roles";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;

    if (!user) {
      const isPublicAuth =
        pathname === "/admin/login" || pathname === "/admin/login/verify-otp";
      if (!isPublicAuth) router.push("/admin/login");
      return;
    }

    if (!isAdminUser(user)) {
      toast.error("You do not have admin access.");
      router.push("/dashboard");
      return;
    }

    setIsAuthorized(true);
  }, [user, loading, pathname, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/admin/login");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  if (pathname === "/admin/login" || pathname === "/admin/login/verify-otp") {
    return <>{children}</>;
  }

  if (loading || !isAuthorized) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-white">
        <Loader2 className="animate-spin mr-2" /> Verifying Admin Access...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-950">
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 z-30 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-600 rounded-lg text-white">
            <ShieldCheck size={18} />
          </div>
          <span className="font-bold tracking-wide text-sm">ADMIN PORTAL</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700/80 rounded-lg transition"
          >
            {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-20 mt-16 dark:bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
          w-64 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex flex-col fixed h-full z-40 transition-transform duration-300 ease-in-out border-r border-slate-200 dark:border-slate-700 dark:shadow-[4px_0_24px_-2px_rgba(0,0,0,0.45)]
          lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          mt-16 lg:mt-0
        `}
      >
        <div className="hidden lg:flex p-6 border-b border-slate-200 dark:border-slate-700 items-center justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-emerald-600 rounded-lg text-white shrink-0">
              <ShieldCheck size={20} />
            </div>
            <span className="font-bold text-slate-900 dark:text-white tracking-wide truncate">
              ADMIN PORTAL
            </span>
          </div>
          <ThemeToggle />
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
          <NavLink
            href="/admin/dashboard/questions"
            icon={<BookOpen size={20} />}
            label="Question Bank"
            active={pathname.includes("/questions")}
          />
          <NavLink
            href="/admin/dashboard/subjects"
            icon={<LayoutGrid size={20} />}
            label="Manage Subjects"
            active={pathname.includes("/subjects")}
          />
          <NavLink
            href="/admin/dashboard/users"
            icon={<Users size={20} />}
            label="Users"
            active={pathname.includes("/users")}
          />
          <NavLink
            href="/admin/dashboard/packages"
            icon={<Package size={20} />}
            label="Packages"
            active={pathname.includes("/packages")}
          />
          <NavLink
            href="/admin/dashboard/payments"
            icon={<CreditCard size={20} />}
            label="Payments"
            active={pathname.includes("/payments")}
          />
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-2">
          <div className="lg:hidden flex justify-center pb-1">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition w-full"
          >
            <LogOut size={20} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 overflow-y-auto mt-16 lg:mt-0 bg-slate-50 dark:bg-slate-950 dark:min-h-screen">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

function NavLink({ href, icon, label, active }: { href: string; icon: ReactNode; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active
          ? "bg-emerald-600 text-white font-bold shadow-lg dark:shadow-emerald-950/40"
          : "hover:bg-slate-100 dark:hover:bg-slate-700/60 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      {icon} <span className="text-sm">{label}</span>
    </Link>
  );
}
