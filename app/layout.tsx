import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "JAMB CBT Practice Made Easy - Sureprep",
  description: "JAMB CBT practice app with over 10,000 questions. Sureprep CBT app Works on mobile and desktop.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-cabinet-grotesk">
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
