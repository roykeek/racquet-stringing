"use client";

import { useEffect, useState } from "react";
import { getRestockAlerts } from "@/app/actions";
import { AlertCircle, X } from "lucide-react";

export default function RestockAlerts() {
    const [alerts, setAlerts] = useState<{ stringName: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [dismissed, setDismissed] = useState(false);

    useEffect(() => {
        async function fetchAlerts() {
            setLoading(true);
            try {
                // Fetch strings used 10+ times in the last 30 days
                const res = await getRestockAlerts(10, 30);
                setAlerts(res);
            } catch (error) {
                console.error("Failed to fetch restock alerts", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    if (loading || alerts.length === 0 || dismissed) return null;

    return (
        <div className="mb-6 bg-white border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-500 w-5 h-5" />
                <h3 className="font-bold text-gray-900">התראות מלאי</h3>
                <button
                    onClick={() => setDismissed(true)}
                    className="mr-auto text-gray-400 hover:text-gray-600 transition"
                    aria-label="סגור"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-1 text-sm">
                {alerts.map(alert => (
                    <li key={alert.stringName}>
                        השתמשת ב-<strong>{alert.stringName}</strong> ב-{alert.count} עבודות ב-30 הימים האחרונים — כדאי לחדש מלאי?
                    </li>
                ))}
            </ul>
        </div>
    );
}
