import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { ThemeProvider } from "./components/theme-provider";
import { AppToaster } from "./components/app-toaster";

export const metadata: Metadata = {
  title: "JAMB CBT Practice Made Easy - Sureprep CBT App",
  description: "JAMB CBT practice app with over 10,000 questions. Sureprep CBT app Works on mobile and desktop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-cabinet-grotesk" suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
