import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Image from "next/image";
import "./globals.css";
import StickyWelcomeBanner from "@/components/StickyWelcomeBanner";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
});

export const metadata: Metadata = {
  title: "מועדון הטניס אלוני יצחק",
  description: "Tennis racquet stringing job manager",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <body suppressHydrationWarning className={`${heebo.variable} font-sans antialiased text-gray-900 bg-gray-50 flex flex-col min-h-screen`}>
        {/* Sticky welcome text overlay — mobile only, fades in after scrolling past logo */}
        <StickyWelcomeBanner />

        {/* Global/Persistent Header — scrolls normally */}
        <header className="w-full bg-white shadow-sm border-b border-gray-100 py-4 mb-2 flex flex-col items-center justify-center shrink-0">
          <div className="relative w-24 h-24 mb-2">
            <Image
              src="/logo.jpeg"
              alt="מועדון הטניס אלוני יצחק"
              fill
              sizes="96px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center">
            ברוכים הבאים למועדון הטניס אלוני יצחק
          </h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            הרבה יותר מטניס
          </p>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow flex flex-col items-center">
          <div className="w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
