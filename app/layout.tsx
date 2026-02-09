import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "Parach - JAMB CBT Practice",
  description: "Master CBT with detailed solutions and analytics.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="font-cabinet-grotesk">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
