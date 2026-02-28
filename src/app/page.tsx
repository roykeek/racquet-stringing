import Link from "next/link";
import { Wrench } from "lucide-react";
import { getStringers } from "@/app/actions";
import StringerLoginForm from "@/components/StringerLoginForm";

export default async function Home() {
  const stringers = await getStringers();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-50">
      <main className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Client Card */}
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center text-center space-y-6 transform transition hover:scale-105">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">לקוחות</h2>
          <p className="text-gray-500 text-lg">
            הזמינו שזירה למחבט שלכם בקלות ובמהירות.
          </p>
          <Link
            href="/booking"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 shadow-md text-lg"
          >
            הזמנת שזירה
          </Link>
        </div>

        {/* Stringer Card */}
        <div className="bg-white p-10 rounded-2xl shadow-lg border border-gray-100 flex flex-col text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2">
            <Wrench size={32} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">כניסת מנהלים ושוזרים</h2>
          <p className="text-gray-500 text-lg">
            התחברו למערכת לניהול עבודות ולוח זמנים.
          </p>
          <div className="w-full text-right bg-gray-50 p-6 rounded-xl border border-gray-100">
            <StringerLoginForm stringers={stringers} />
          </div>
        </div>
      </main>

      <footer className="mt-16 text-gray-400 text-sm">
        מערכת ניהול שזירות מחבטים &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
