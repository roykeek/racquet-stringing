import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getJobsForDashboard, getStringers } from "@/app/actions";
import prisma from "@/lib/prisma";
import DashboardWrapper from "@/components/DashboardWrapper";

export default async function StringerDashboard() {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("stringerAuth");

    if (!authCookie || !authCookie.value) {
        redirect("/");
    }

    const stringerId = parseInt(authCookie.value, 10);

    // Get current stringer name
    const currentUser = await prisma.stringer.findUnique({
        where: { id: stringerId },
        select: { name: true }
    });

    if (!currentUser) {
        redirect("/");
    }

    // Fetch all jobs
    const rawJobs = await getJobsForDashboard();

    // Convert Prisma Decimal fields to plain JavaScript numbers to avoid Next.js serialization errors
    // when passing data from Server Components to Client Components.
    const allJobs = rawJobs.map(job => ({
        ...job,
        mainsTensionLbs: Number(job.mainsTensionLbs),
        crossTensionLbs: Number(job.crossTensionLbs)
    }));
    const stringers = await getStringers();

    return (
        <div className="min-h-screen bg-gray-100 font-sans">
            <DashboardWrapper
                currentUser={{ id: stringerId, name: currentUser.name }}
                allJobs={allJobs}
                stringers={stringers}
            />
        </div>
    );
}
