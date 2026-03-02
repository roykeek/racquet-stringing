import Link from "next/link";
import { Wrench } from "lucide-react";
import { getStringers } from "@/app/actions";
import StringerLoginForm from "@/components/StringerLoginForm";

export default async function Home() {
  const stringers = await getStringers();

  return (
    <div className="w-full flex flex-col items-center pt-8 pb-16 px-8">
      <main className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Client Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col space-y-6 transform transition hover:scale-105" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="26"
                height="26"
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
            <h2 className="text-3xl font-bold text-gray-900 flex-1 text-right">לקוחות</h2>
          </div>
          <p className="text-gray-500 text-lg text-right">
            הזמינו שזירה למחבט שלכם בקלות ובמהירות.
          </p>
          <Link
            href="/booking"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition duration-200 shadow-md text-lg text-center"
          >
            הזמנת שזירה
          </Link>
        </div>

        {/* Stringer Card */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col space-y-6" dir="rtl">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shrink-0">
              <Wrench size={26} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 flex-1 text-right">כניסת מנהלים ושוזרים</h2>
          </div>
          <p className="text-gray-500 text-lg text-right">
            התחברו למערכת לניהול עבודות ולוח זמנים.
          </p>
          <div className="w-full text-right bg-gray-50 p-6 rounded-xl border border-gray-100">
            <StringerLoginForm stringers={stringers} />
          </div>
        </div>
      </main>

      <footer className="mt-16 text-gray-400 text-sm text-center space-y-1">


        <p>מערכת ניהול שזירות מחבטים &copy; {new Date().getFullYear()}</p>
        <p>הוקם ע&quot;י תומר קרני</p>
      </footer>
    </div >
  );
}
