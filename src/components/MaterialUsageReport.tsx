"use client";

import { useEffect, useState } from "react";
import { getMaterialUsageReport, MaterialUsageData } from "@/app/actions";

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
        <div className="bg-white dark:bg-zinc-800 p-6 rounded-lg shadow-sm border border-zinc-200 dark:border-zinc-700">
            <h2 className="text-xl font-bold mb-4">Material Usage Report</h2>

            <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium mb-1">Start Date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={e => setStartDate(e.target.value)}
                        className="p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">End Date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={e => setEndDate(e.target.value)}
                        className="p-2 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
                    />
                </div>
                <div className="flex-grow">
                    <label className="block text-sm font-medium mb-1">Filter String</label>
                    <input
                        type="text"
                        placeholder="e.g. RPM Blast..."
                        value={filterString}
                        onChange={e => setFilterString(e.target.value)}
                        className="p-2 border rounded-md w-full dark:bg-zinc-900 dark:border-zinc-700"
                    />
                </div>
                <div className="flex items-end">
                    <button
                        onClick={() => { setStartDate(""); setEndDate(""); setFilterString(""); }}
                        className="p-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-zinc-700 rounded-md transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-8 text-zinc-500">Loading report...</div>
            ) : data.length === 0 ? (
                <div className="text-center py-8 text-zinc-500">No usage data found for this period.</div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b dark:border-zinc-700">
                                <th className="p-3">String Name</th>
                                <th className="p-3">Used in Mains</th>
                                <th className="p-3">Used in Crosses</th>
                                <th className="p-3 font-bold">Total Jobs</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.stringName} className="border-b dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700/50">
                                    <td className="p-3 font-medium">{item.stringName}</td>
                                    <td className="p-3">{item.mainsCount}</td>
                                    <td className="p-3">{item.crossesCount}</td>
                                    <td className="p-3 font-bold text-blue-600 dark:text-blue-400">{item.totalCount}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
