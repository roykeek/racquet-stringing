import { getManufacturers } from "@/app/actions";
import BookingForm from "@/components/BookingForm";
import Link from "next/link";
import { LogOut } from "lucide-react";

export default async function BookingPage() {
    const manufacturers = await getManufacturers();

    return (
        <div className="w-full flex flex-col items-center pt-8 pb-16 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-6 left-6 lg:left-12">
                <Link
                    href="/"
                    className="flex p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                    title="יציאה"
                >
                    <LogOut size={20} />
                </Link>
            </div>

            <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-2xl shadow-xl border border-gray-100 mt-4">
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
