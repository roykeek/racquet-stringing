import { getManufacturers } from "@/app/actions";
import BookingForm from "@/components/BookingForm";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default async function BookingPage() {
    const manufacturers = await getManufacturers();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative">
            <div className="absolute top-6 right-6 lg:right-12">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200"
                >
                    <ArrowRight size={20} />
                    <span>יציאה</span>
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
