"use client";

import * as xlsx from "xlsx";
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

    const exportToExcel = () => {
        // Flatten the data for Excel columns
        const excelData = jobs.map(job => ({
            "Job ID": job.id,
            "Client Name": job.clientName,
            "Phone": job.clientPhone,
            "Racquet Model": job.racquetModel ? `${job.racquetModel.manufacturer.name} ${job.racquetModel.name}` : "Unknown",
            "String Mains": job.stringMain || "N/A",
            "Mains Tension (Lbs)": job.mainsTensionLbs ? Number(job.mainsTensionLbs) : "",
            "String Crosses": job.stringCross || "N/A",
            "Crosses Tension (Lbs)": job.crossTensionLbs ? Number(job.crossTensionLbs) : "",
            "Completed Date": job.completedAt ? new Date(job.completedAt).toLocaleDateString() : (job.status === "Completed" ? "Completed (No Date)" : "N/A"),
            "Stringer Name": job.stringer?.name || "Unassigned",
            "Status": job.status,
            "Created At": new Date(job.createdAt).toLocaleDateString()
        }));

        const worksheet = xlsx.utils.json_to_sheet(excelData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Jobs");

        xlsx.writeFile(workbook, `Racquet_Stringing_Jobs_${new Date().toISOString().split('T')[0]}.xlsx`);
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
