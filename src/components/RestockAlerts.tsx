"use client";

import { useEffect, useState } from "react";
import { getRestockAlerts } from "@/app/actions";
import { AlertCircle } from "lucide-react";

export default function RestockAlerts() {
    const [alerts, setAlerts] = useState<{ stringName: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true);

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

    if (loading || alerts.length === 0) return null;

    return (
        <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 p-4 rounded-r-md">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-600 dark:text-amber-500 w-5 h-5" />
                <h3 className="font-bold text-amber-800 dark:text-amber-400">התראות מלאי</h3>
            </div>
            <ul className="list-disc list-inside text-amber-700 dark:text-amber-300 space-y-1 ml-1 text-sm">
                {alerts.map(alert => (
                    <li key={alert.stringName}>
                        השתמשת ב-<strong>{alert.stringName}</strong> ב-{alert.count} עבודות ב-30 הימים האחרונים — כדאי לחדש מלאי?
                    </li>
                ))}
            </ul>
        </div>
    );
}
