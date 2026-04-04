"use client";

import type { ReactNode } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, BookOpen, User, LogOut, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { isAdminUser } from "@/app/lib/auth/roles";
import { ThemeToggle } from "@/app/components/theme-toggle";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    if (isAdminUser(user)) {
      router.replace("/admin/dashboard");
    }
  }, [user, loading, router]);

  if (loading || !user || isAdminUser(user)) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400">
        Loading dashboard...
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden dark:bg-black/60"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">Sure Prep</span>
          <ThemeToggle />
        </div>

        <nav className="p-4 space-y-2">
          <NavItem href="/dashboard" icon={<LayoutDashboard size={20} />} label="Overview" />
          <NavItem href="/dashboard/practice" icon={<BookOpen size={20} />} label="Practice CBT" />
          <NavItem href="/dashboard/profile" icon={<User size={20} />} label="My Profile" />

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:hidden">
          <span className="font-bold text-emerald-600 dark:text-emerald-400">Sure Prep</span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open menu">
              <Menu size={24} className="text-slate-600 dark:text-slate-300" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}

function NavItem({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 rounded-xl transition font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
