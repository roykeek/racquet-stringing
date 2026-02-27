"use client";

import { useState } from "react";
import { Wrench, LogOut, Phone, MessageCircle, Calendar } from "lucide-react";
import { logoutStringer, updateJobStatus } from "@/app/actions";
import { useRouter } from "next/navigation";

export default function DashboardWrapper({
    currentUser,
    allJobs,
}: {
    currentUser: { id: number; name: string };
    allJobs: any[];
}) {
    const router = useRouter();

    // Sub-filter the jobs into columns
    const waitingQueue = allJobs.filter((j) => j.status === "Waiting");
    const scheduledJobs = allJobs.filter((j) => j.status === "Scheduled");
    const inProcessJobs = allJobs.filter(
        (j) => j.status === "In Process" && j.stringerId === currentUser.id
    );
    const completedJobs = allJobs.filter(
        (j) => j.status === "Completed" && j.stringerId === currentUser.id
    );

    const handleLogout = async () => {
        await logoutStringer();
        router.push("/stringer/login");
    };

    const handleStatusChange = async (jobId: number, status: string, stringerId?: number) => {
        // Basic schedule assigning to current day and current user for MVP
        let date = status === "Scheduled" ? new Date() : undefined;
        await updateJobStatus(jobId, status, stringerId, date);
    };

    return (
        <>
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10 w-full px-6 py-4 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <Wrench className="text-emerald-600" />
                    <h1 className="text-2xl font-bold text-gray-800 tracking-tight hidden md:block">
                        מערכת ניהול שזירות
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100">
                        <span className="font-medium text-emerald-800">{currentUser.name}</span>
                        <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full">שזר</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition"
                        title="התנתק"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Grid Layout */}
            <main className="p-6 max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Column 1 (Right): Waiting Queue */}
                <section className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center justify-between mb-4 border-b pb-2">
                            <span>תור המתנה</span>
                            <span className="bg-blue-100 text-blue-700 text-sm py-1 px-3 rounded-full">{waitingQueue.length}</span>
                        </h2>
                        <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                            {waitingQueue.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">אין הזמנות חדשות</p>
                            ) : (
                                waitingQueue.map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onAction={() => handleStatusChange(job.id, "Scheduled", currentUser.id)}
                                        actionText="שבץ ליומן"
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Column 2 (Center): Scheduled (Shared Calendar View MVP) */}
                <section className="flex flex-col gap-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sticky top-24">
                        <h2 className="text-xl font-bold text-gray-800 flex items-center justify-between mb-4 border-b pb-2">
                            <span>יומן שזירות (משותף)</span>
                            <span className="bg-yellow-100 text-yellow-700 text-sm py-1 px-3 rounded-full">{scheduledJobs.length}</span>
                        </h2>
                        <div className="space-y-3 overflow-y-auto max-h-[75vh] pr-2 custom-scrollbar">
                            {scheduledJobs.length === 0 ? (
                                <p className="text-center text-gray-400 py-8">אין הזמנות משובצות</p>
                            ) : (
                                scheduledJobs.map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onAction={() => handleStatusChange(job.id, "In Process", currentUser.id)}
                                        actionText="התחל עבודה"
                                        showAssignee
                                        highlight={job.stringerId === currentUser.id ? "yellow" : "gray"}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </section>

                {/* Column 3 (Left): Work Management */}
                <section className="flex flex-col gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-emerald-200 p-4 sticky top-24">
                        <h2 className="text-xl font-bold text-emerald-800 flex items-center justify-between mb-4 border-b border-emerald-100 pb-2">
                            <span>העבודות שלי</span>
                            <span className="bg-emerald-100 text-emerald-700 text-sm py-1 px-3 rounded-full">{inProcessJobs.length}</span>
                        </h2>
                        <div className="space-y-3 mb-6">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">בתהליך עבודה:</h3>
                            {inProcessJobs.length === 0 ? (
                                <p className="text-center text-gray-400 py-4 text-sm">אין מחבטים בעבודה כרגע</p>
                            ) : (
                                inProcessJobs.map((job) => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onAction={() => handleStatusChange(job.id, "Completed", currentUser.id)}
                                        actionText="סיים עבודה"
                                        highlight="green"
                                    />
                                ))
                            )}
                        </div>

                        <div className="space-y-3 border-t border-emerald-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-500 mb-2">היסטוריה (הושלם):</h3>
                            {completedJobs.length === 0 ? (
                                <p className="text-center text-gray-400 py-4 text-sm">לא הושלמו עבודות</p>
                            ) : (
                                completedJobs.slice(0, 5).map((job) => (
                                    <div key={job.id} className="p-3 bg-gray-50 border border-gray-100 rounded-lg flex justify-between items-center opacity-70">
                                        <span className="font-medium text-gray-700 text-sm">{job.clientName}</span>
                                        <span className="text-xs text-gray-500">{new Date(job.updatedAt || job.createdAt).toLocaleDateString("he-IL")}</span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-emerald-100 text-center">
                            <button className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold py-3 px-4 rounded-xl transition border border-emerald-200 shadow-sm text-sm">
                                + הוסף שזר חדש למערכת
                            </button>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}

// ----------------------------------------
// Subcomponent: Job Card
// ----------------------------------------
function JobCard({
    job,
    onAction,
    actionText,
    showAssignee = false,
    highlight = "gray"
}: {
    job: any,
    onAction: () => void,
    actionText: string,
    showAssignee?: boolean,
    highlight?: "gray" | "yellow" | "green"
}) {
    const isImmediate = job.urgency === "Immediate";
    const bgClasses = {
        gray: "bg-white border-gray-200 hover:border-blue-300",
        yellow: "bg-yellow-50 border-yellow-200",
        green: "bg-emerald-50 border-emerald-200",
    };

    return (
        <div className={`p-4 rounded-xl shadow-sm border transition ${bgClasses[highlight]} ${isImmediate && highlight === 'gray' ? 'border-red-300 shadow-red-50' : ''}`}>
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{job.clientName}</h3>
                {isImmediate && (
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">דחוף</span>
                )}
            </div>

            <div className="text-sm text-gray-600 mb-3 space-y-1">
                <p><span className="font-medium text-gray-500">מחבט:</span> {job.customRacquetInfo || `${job.racquetModel?.manufacturer?.name} ${job.racquetModel?.name}`}</p>
                <p><span className="font-medium text-gray-500">גיד:</span> {job.stringTypes}</p>
                <p dir="ltr" className="text-right">
                    <span className="font-medium text-gray-500 ml-1">:מתיחה</span>
                    {job.mainsTensionLbs} / {job.crossTensionLbs} Lbs
                </p>
                <p><span className="font-medium text-gray-500">מספר מחבטים:</span> {job.racquetCount}</p>
                {showAssignee && job.stringer && (
                    <p className="mt-2 text-xs bg-white inline-block px-2 py-1 rounded-md border border-gray-200">
                        באחריות: <strong>{job.stringer.name}</strong>
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100/50">
                <button
                    onClick={onAction}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-2 rounded-lg transition"
                >
                    {actionText}
                </button>

                <a
                    href={`tel:${job.clientPhone}`}
                    className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                    title="התקשר ללקוח"
                >
                    <Phone size={18} />
                </a>
                <a
                    href={`https://wa.me/${job.clientPhone.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg transition"
                    title="שלח וואטסאפ"
                >
                    <MessageCircle size={18} />
                </a>
            </div>
        </div>
    );
}
