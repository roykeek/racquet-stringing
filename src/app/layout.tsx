import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import Image from "next/image";
import "./globals.css";

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
        {/* Global/Persistent Header — fixed + semi-transparent on mobile, static on desktop */}
        <header className="
          fixed top-0 left-0 right-0 z-50
          md:static md:z-auto
          w-full
          bg-white/60 md:bg-white
          backdrop-blur-md md:backdrop-blur-none
          shadow-sm border-b border-gray-100
          py-3 md:py-4
          mb-0 md:mb-2
          flex flex-col items-center justify-center shrink-0
        ">
          <div className="relative w-16 h-16 md:w-24 md:h-24 mb-1 md:mb-2">
            <Image
              src="/logo.jpeg"
              alt="מועדון הטניס אלוני יצחק"
              fill
              sizes="(max-width: 768px) 64px, 96px"
              className="object-contain"
              priority
            />
          </div>
          <h1 className="text-lg md:text-xl font-bold text-gray-900/80 md:text-gray-900 text-center">
            ברוכים הבאים למועדון הטניס אלוני יצחק
          </h1>
          <p className="text-xs md:text-sm text-gray-500/80 md:text-gray-500 text-center mt-0.5 md:mt-1">
            הרבה יותר מטניס
          </p>
        </header>

        {/* Main Content Area — top padding on mobile to clear the fixed header */}
        <main className="flex-grow flex flex-col items-center pt-[148px] md:pt-0">
          <div className="w-full">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}
