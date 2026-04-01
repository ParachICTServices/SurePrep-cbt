import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Sure Prep- JAMB CBT Practice",
  description: "Master CBT with detailed solutions and analytics.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="font-cabinet-grotesk">
      <head>
<link rel="stylesheet" href="https:
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}