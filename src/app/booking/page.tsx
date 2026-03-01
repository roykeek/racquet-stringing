import { getManufacturers } from "@/app/actions";
import BookingForm from "@/components/BookingForm";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default async function BookingPage() {
    const manufacturers = await getManufacturers();

    return (
        <div className="w-full flex flex-col items-center pt-4 pb-16 px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl w-full mb-2 flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-600">
                    <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="18"
                            height="18"
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
                    <span className="text-sm font-semibold text-gray-600">הזמנת שזירה</span>
                </div>
                <Link
                    href="/"
                    className="flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="יציאה"
                >
                    <LogOut size={20} />
                </Link>
            </div>

            <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        הזמנת שזירה למחבט
                    </h1>
                    <p className="text-gray-500">
                        אנא מלאו את הפרטים מטה כדי שנוכל להתחיל לטפל במחבט שלכם.
                    </p>
                </div>

                <BookingForm initialManufacturers={manufacturers} />
            </div>
        </div>
    );
}
