"use client";

import { useEffect, useState } from "react";
import { getMaterialUsageReport, MaterialUsageData } from "@/app/actions";
import { formatDate } from "@/lib/dateUtils";

export default function MaterialUsageReport() {
    const [data, setData] = useState<MaterialUsageData[]>([]);
    const [loading, setLoading] = useState(true);

    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [filterString, setFilterString] = useState<string>("");

    useEffect(() => {
        async function loadReport() {
            setLoading(true);
            const start = startDate ? new Date(startDate) : undefined;
            const end = endDate ? new Date(endDate) : undefined;
            // Adjust end date to include the whole day if selected
            if (end) {
                end.setHours(23, 59, 59, 999);
            }

            const report = await getMaterialUsageReport(start, end, filterString);
            setData(report);
            setLoading(false);
        }

        // Debounce fetching slightly when typing
        const timer = setTimeout(() => {
            loadReport();
        }, 300);

        return () => clearTimeout(timer);
    }, [startDate, endDate, filterString]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-emerald-200">
            <h2 className="text-xl font-bold text-emerald-800 mb-6 flex items-center justify-between border-b border-emerald-100 pb-2">
                <span>דוח שימוש בגידים (מלאי)</span>
            </h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6 bg-emerald-50 p-4 rounded-lg border border-emerald-100 items-end">
                <div className="flex flex-col">
                    <label className="text-xs text-emerald-800 font-medium mb-1">
                        מתאריך (DD/MM/YYYY)
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="border-emerald-200 rounded-lg p-2 border text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white h-[42px]"
                    />
                </div>
                <div className="flex flex-col">
                    <label className="text-xs text-emerald-800 font-medium mb-1">
                        עד תאריך (DD/MM/YYYY)
                    </label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="border-emerald-200 rounded-lg p-2 border text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-white h-[42px]"
                    />
                </div>
                <div className="flex-grow flex flex-col">
                    <label className="text-xs text-emerald-800 font-medium mb-1">חיפוש גיד ספציפי</label>
                    <input
                        type="text"
                        placeholder="למשל: RPM Blast..."
                        value={filterString}
                        onChange={e => setFilterString(e.target.value)}
                        className="p-2 border border-emerald-200 rounded-lg w-full focus:border-emerald-500 focus:ring-emerald-500 bg-white text-sm h-[42px]"
                        dir="ltr"
                    />
                </div>
                <div>
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); setFilterString(""); }}
                        className="px-3 text-sm text-emerald-700 hover:bg-emerald-100 rounded-lg transition-colors font-medium border border-transparent h-[42px] whitespace-nowrap"
                    >
                        נקה סינונים
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-emerald-600 font-medium">טוען נתונים...</div>
            ) : data.length === 0 ? (
                <div className="text-center py-8 text-gray-500">לא נמצאו נתוני שימוש בגידים בתקופה זו.</div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-right border-collapse bg-white">
                        <thead className="bg-gray-50 text-gray-700">
                            <tr className="border-b border-gray-200">
                                <th className="p-3 font-semibold">שם הגיד</th>
                                <th className="p-3 font-semibold text-center text-emerald-700">שזור לאורך (Mains)</th>
                                <th className="p-3 font-semibold text-center text-emerald-700">שזור לרוחב (Crosses)</th>
                                <th className="p-3 font-bold text-center text-gray-900">סה״כ שימושים</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.map(item => (
                                <tr key={item.stringName} className="hover:bg-emerald-50/50 transition-colors">
                                    <td className="p-3 font-medium text-gray-800" dir="ltr">{item.stringName}</td>
                                    <td className="p-3 text-center text-gray-600">{item.mainsCount}</td>
                                    <td className="p-3 text-center text-gray-600">{item.crossesCount}</td>
                                    <td className="p-3 text-center font-bold text-emerald-700">{item.totalCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
