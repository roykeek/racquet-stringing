"use client";

import { useState } from "react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Download, Loader2 } from "lucide-react";
import { getJobsForExport } from "@/app/actions";
import { formatDate } from "@/lib/dateUtils";

export default function ExcelExportButton() {
    // Default to last 30 days
    const defaultStart = new Date();
    defaultStart.setDate(defaultStart.getDate() - 30);

    const [startDate, setStartDate] = useState(defaultStart.toISOString().split("T")[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
    const [isExporting, setIsExporting] = useState(false);

    // Calculate max and min dates for the HTML inputs
    const todayStr = new Date().toISOString().split("T")[0];
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const twoYearsAgoStr = twoYearsAgo.toISOString().split("T")[0];

    const exportToExcel = async () => {
        setIsExporting(true);
        try {
            const startStr = new Date(startDate);
            const endStr = new Date(endDate);

            // Fetch exactly the narrowed dataset instead of using `allJobs`
            const jobs = await getJobsForExport(startStr, endStr);

            if (jobs.length === 0) {
                alert("לא נמצאו עבודות בטווח התאריכים הנבחר.");
                return;
            }

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Jobs");

            // Define Columns
            worksheet.columns = [
                { header: "Job ID", key: "id", width: 10 },
                { header: "Client Name", key: "clientName", width: 20 },
                { header: "Phone", key: "phone", width: 15 },
                { header: "Racquet Model", key: "racquetModel", width: 25 },
                { header: "String Mains", key: "stringMains", width: 20 },
                { header: "Mains Tension (Lbs)", key: "mainsTension", width: 20 },
                { header: "String Crosses", key: "stringCrosses", width: 20 },
                { header: "Crosses Tension (Lbs)", key: "crossesTension", width: 22 },
                { header: "Completed Date", key: "completedDate", width: 15 },
                { header: "Stringer Name", key: "stringerName", width: 15 },
                { header: "Status", key: "status", width: 15 },
                { header: "Created At", key: "createdAt", width: 15 },
            ];

            // Make Header Row Bold
            worksheet.getRow(1).font = { bold: true };

            // Add Data Rows
            jobs.forEach(job => {
                worksheet.addRow({
                    id: job.trackingUUID.substring(0, 8), // Show short UUID instead of DB ID
                    clientName: job.clientName,
                    phone: job.clientPhone,
                    racquetModel: job.racquetModel ? `${job.racquetModel.manufacturer.name} ${job.racquetModel.name}` : "Unknown",
                    stringMains: job.stringMain || "N/A",
                    mainsTension: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : "",
                    stringCrosses: job.stringCross || "N/A",
                    crossesTension: job.crossTensionLbs ? Number(job.crossTensionLbs) : "",
                    completedDate: job.completedAt ? formatDate(job.completedAt) : (job.status === "Completed" ? "Completed (No Date)" : "N/A"),
                    stringerName: job.stringer?.name || "Unassigned",
                    status: job.status,
                    createdAt: formatDate(job.createdAt)
                });
            });

            // Generate Buffer and Trigger Download
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

            const startFmt = formatDate(startDate).replace(/\//g, "-");
            const endFmt = formatDate(endDate).replace(/\//g, "-");

            saveAs(blob, `Racquet_Stringing_Jobs_${startFmt}_to_${endFmt}.xlsx`);
        } catch (error) {
            console.error("Export failed", error);
            alert("שגיאה בייצוא הנתונים.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex flex-col sm:flex-row items-end gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex flex-col">
                <label className="text-xs text-gray-500 font-medium mb-1">
                    מתאריך (DD/MM/YYYY)
                </label>
                <input
                    type="date"
                    value={startDate}
                    min={twoYearsAgoStr}
                    max={endDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="border-gray-300 rounded-lg p-2 border text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 h-[42px]"
                />
            </div>
            <div className="flex flex-col">
                <label className="text-xs text-gray-500 font-medium mb-1">
                    עד תאריך (DD/MM/YYYY)
                </label>
                <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    max={todayStr}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="border-gray-300 rounded-lg p-2 border text-sm focus:border-emerald-500 focus:ring-emerald-500 bg-gray-50 h-[42px]"
                />
            </div>
            <button
                onClick={exportToExcel}
                disabled={isExporting}
                className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors text-sm font-medium h-[42px] disabled:bg-emerald-400"
            >
                {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {isExporting ? "מייצא..." : "Export to Excel"}
            </button>
        </div>
    );
}
