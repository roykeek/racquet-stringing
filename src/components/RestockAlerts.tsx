"use client";

import { useEffect, useState } from "react";
import { getRestockAlerts } from "@/app/actions";
import { AlertCircle, X } from "lucide-react";

const STORAGE_KEY_PREFIX = "restock_dismissed_v1_";

function getDismissedNames(stringerId: number): Set<string> {
    try {
        const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${stringerId}`);
        return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
        return new Set();
    }
}

function saveDismissedNames(stringerId: number, names: Set<string>) {
    try {
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${stringerId}`, JSON.stringify([...names]));
    } catch {
        // localStorage unavailable — fail silently
    }
}

export default function RestockAlerts() {
    const [alerts, setAlerts] = useState<{ stringName: string, count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [stringerId, setStringerId] = useState<number | null>(null);

    useEffect(() => {
        async function fetchAlerts() {
            setLoading(true);
            try {
                const { alerts: fetched, stringerId: id } = await getRestockAlerts(10, 30);
                const dismissed = getDismissedNames(id);
                setStringerId(id);
                setAlerts(fetched.filter(a => !dismissed.has(a.stringName)));
            } catch (error) {
                console.error("Failed to fetch restock alerts", error);
            } finally {
                setLoading(false);
            }
        }
        fetchAlerts();
    }, []);

    function handleDismiss() {
        if (stringerId === null) return;
        const dismissed = getDismissedNames(stringerId);
        alerts.forEach(a => dismissed.add(a.stringName));
        saveDismissedNames(stringerId, dismissed);
        setAlerts([]);
    }

    if (loading || alerts.length === 0) return null;

    return (
        <div className="mb-6 bg-white border-l-4 border-amber-500 p-4 rounded-r-md shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-amber-500 w-5 h-5" />
                <h3 className="font-bold text-gray-900">התראות מלאי</h3>
                <button
                    onClick={handleDismiss}
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
