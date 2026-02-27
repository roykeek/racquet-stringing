import { getStringers } from "@/app/actions";
import StringerLoginForm from "@/components/StringerLoginForm";

export default async function StringerLoginPage() {
    const stringers = await getStringers();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100 relative overflow-hidden">
                {/* Decorative Top Accent */}
                <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>

                <div className="text-center">
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
                        כניסת מנהלים ושזרים
                    </h1>
                    <p className="text-gray-500">
                        הזן את פרטייך כדי לגשת לניהול ההזמנות ולוח השזירות.
                    </p>
                </div>

                <StringerLoginForm stringers={stringers} />
            </div>

            <footer className="mt-8 text-sm text-gray-400">
                לכניסה ראשונית: משתמש <strong>Tomer</strong> / סיסמה <strong>1t2k</strong>
            </footer>
        </div>
    );
}
