import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/contexts/UserContext";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { Toaster } from "sonner";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "로허브 - 민사소송/채권 관리 시스템",
  description: "효율적인 민사소송 및 채권 관리를 위한 웹 애플리케이션",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <UserProvider>
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-950 dark:to-gray-900">
              <Navbar />
              <main className="flex-1 pt-2">{children}</main>
            </div>
            <Toaster position="top-right" theme="system" richColors />
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
