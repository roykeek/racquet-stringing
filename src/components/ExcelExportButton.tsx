"use client";

import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { Download } from "lucide-react";
import type { Prisma } from "@prisma/client";

// Define the shape based on the include we'll add in the Server Action/Page
type JobWithRelations = Prisma.ServiceJobGetPayload<{
    include: {
        racquetModel: { include: { manufacturer: true } },
        stringer: true
    }
}>;

export default function ExcelExportButton({ jobs }: { jobs: JobWithRelations[] }) {

    const exportToExcel = async () => {
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
                id: job.id,
                clientName: job.clientName,
                phone: job.clientPhone,
                racquetModel: job.racquetModel ? `${job.racquetModel.manufacturer.name} ${job.racquetModel.name}` : "Unknown",
                stringMains: job.stringMain || "N/A",
                mainsTension: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : "",
                stringCrosses: job.stringCross || "N/A",
                crossesTension: job.crossTensionLbs ? Number(job.crossTensionLbs) : "",
                completedDate: job.completedAt ? new Date(job.completedAt).toLocaleDateString() : (job.status === "Completed" ? "Completed (No Date)" : "N/A"),
                stringerName: job.stringer?.name || "Unassigned",
                status: job.status,
                createdAt: new Date(job.createdAt).toLocaleDateString()
            });
        });

        // Generate Buffer and Trigger Download
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
        saveAs(blob, `Racquet_Stringing_Jobs_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    return (
        <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
        >
            <Download className="w-4 h-4" />
            Export to Excel
        </button>
    );
}
