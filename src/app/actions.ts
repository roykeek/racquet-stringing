"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createHmac, timingSafeEqual } from "crypto";

// ==========================================
// SESSION TOKEN HELPERS
// ==========================================

function getSessionSecret(): string {
    const secret = process.env.SESSION_SECRET;
    if (!secret) throw new Error("SESSION_SECRET environment variable is not set.");
    return secret;
}

function signToken(stringerId: number): string {
    const payload = String(stringerId);
    const sig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
    return `${payload}.${sig}`;
}

function verifyToken(token: string): number | null {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const payload = token.slice(0, dotIndex);
    const receivedSig = token.slice(dotIndex + 1);

    const expectedSig = createHmac("sha256", getSessionSecret()).update(payload).digest("hex");

    // Use timing-safe comparison to prevent timing attacks
    try {
        const match = timingSafeEqual(Buffer.from(receivedSig, "hex"), Buffer.from(expectedSig, "hex"));
        if (!match) return null;
    } catch {
        return null;
    }

    const id = parseInt(payload, 10);
    return isNaN(id) ? null : id;
}

export async function getManufacturers() {
    const manufacturers = await prisma.manufacturer.findMany({
        orderBy: { name: "asc" },
    });

    // Sort so "Other" is always at the bottom
    const other = manufacturers.find(m => m.name === "Other");
    const rest = manufacturers.filter(m => m.name !== "Other");

    return other ? [...rest, other] : rest;
}

export async function getModelsByManufacturerId(manufacturerId: number) {
    const models = await prisma.racquetModel.findMany({
        where: { manufacturerId },
        orderBy: { name: "asc" },
    });

    // Sort so "Other" is always at the bottom
    const other = models.find(m => m.name === "Other");
    const rest = models.filter(m => m.name !== "Other");

    return other ? [...rest, other] : rest;
}

export async function createServiceJob(data: {
    clientName: string;
    clientPhone: string;
    modelId: number | null;
    customRacquetInfo: string | null;
    stringMain: string | null;
    stringCross: string | null;
    mainsTensionLbs: number | null;
    crossTensionLbs: number | null;
    racquetCount: number;
    urgency: string;
    dueDate: Date;
}) {
    try {
        const job = await prisma.serviceJob.create({
            data: {
                ...data,
            },
        });

        // In a real app we might revalidate stringer dashboards
        revalidatePath("/stringer");

        return { success: true, trackingId: job.trackingUUID };
    } catch (error) {
        console.error("Failed to create job:", error);
        return { success: false, error: "Failed to create booking" };
    }
}

// ==========================================
// STRINGER INTERNAL ACTIONS
// ==========================================
import * as bcrypt from "bcrypt";
import { cookies } from "next/headers";

/**
 * Verifies the request is coming from an authenticated, active stringer.
 * Throws an error if the cookie is missing, invalid, or the stringer is inactive.
 * Call this at the start of every stringer-only Server Action.
 */
async function requireStringerAuth(): Promise<number> {
    const cookieStore = await cookies();
    const raw = cookieStore.get("stringerAuth")?.value;
    if (!raw) throw new Error("Unauthorized");

    const stringerId = verifyToken(raw);
    if (stringerId === null) throw new Error("Unauthorized");

    const stringer = await prisma.stringer.findUnique({
        where: { id: stringerId },
        select: { id: true, isActive: true },
    });

    if (!stringer || !stringer.isActive) throw new Error("Unauthorized");

    return stringer.id;
}

export async function getStringers() {
    return prisma.stringer.findMany({
        where: { isActive: true },
        select: { id: true, name: true }, // Don't expose password hashes
        orderBy: { name: "asc" },
    });
}

export async function loginStringer(stringerId: number, passwordPlain: string) {
    const stringer = await prisma.stringer.findUnique({
        where: { id: stringerId },
    });

    if (!stringer) return { success: false, error: "שזר לא נמצא" };

    if (stringer.lockedUntil && stringer.lockedUntil > new Date()) {
        const minutesLeft = Math.ceil((stringer.lockedUntil.getTime() - Date.now()) / 60000);
        return { success: false, error: `המשתמש נעול. נסה שוב בעוד כ-${minutesLeft} דקות.` };
    }

    const isMatch = await bcrypt.compare(passwordPlain, stringer.passwordHash);

    if (!isMatch) {
        const newFails = stringer.failedLoginAttempts + 1;
        if (newFails >= 10) {
            await prisma.stringer.update({
                where: { id: stringerId },
                data: {
                    failedLoginAttempts: newFails,
                    lockedUntil: new Date(Date.now() + 15 * 60 * 1000)
                }
            });
            return { success: false, error: "החשבון ננעל עקב ריבוי ניסיונות. נסה שוב בעוד 15 דקות." };
        } else {
            await prisma.stringer.update({
                where: { id: stringerId },
                data: { failedLoginAttempts: newFails }
            });
            return { success: false, error: "סיסמה שגויה" };
        }
    }

    // Reset fails on success
    if (stringer.failedLoginAttempts > 0 || stringer.lockedUntil) {
        await prisma.stringer.update({
            where: { id: stringerId },
            data: { failedLoginAttempts: 0, lockedUntil: null }
        });
    }

    const cookieStore = await cookies();
    cookieStore.set("stringerAuth", signToken(stringer.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    return { success: true };
}

export async function logoutStringer() {
    await requireStringerAuth();
    const cookieStore = await cookies();
    cookieStore.delete("stringerAuth");
}

export async function addStringer(name: string, passwordPlain: string) {
    await requireStringerAuth();
    try {
        const hashedPassword = await bcrypt.hash(passwordPlain, 10);
        await prisma.stringer.create({
            data: {
                name,
                passwordHash: hashedPassword,
            },
        });
        revalidatePath("/stringer");
        return { success: true };
    } catch (error) {
        console.error("Failed to add stringer:", error);
        return { success: false, error: "Failed to add stringer (name might exist)" };
    }
}

export async function deactivateStringer(id: number) {
    await requireStringerAuth();
    try {
        const stringer = await prisma.stringer.findUnique({ where: { id } });
        if (stringer?.name === "Tomer") {
            return { success: false, error: "לא ניתן להשבית את המשתמש הראשי Tomer" };
        }

        await prisma.stringer.update({
            where: { id },
            data: { isActive: false },
        });
        revalidatePath("/stringer");
        return { success: true };
    } catch (error) {
        console.error("Failed to deactivate stringer:", error);
        return { success: false, error: "Failed to deactivate stringer" };
    }
}

export type DashboardJob = Awaited<ReturnType<typeof getJobsForDashboard>>[number];

export async function getJobsForDashboard() {
    await requireStringerAuth();
    const jobs = await prisma.serviceJob.findMany({
        include: {
            racquetModel: {
                include: {
                    manufacturer: true
                }
            },
            stringer: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return jobs.map(job => ({
        ...job,
        mainsTensionLbs: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : null,
        crossTensionLbs: job.crossTensionLbs ? Number(job.crossTensionLbs) : null,
    }));
}

export async function updateJobStatus(jobId: number, status: string, stringerId?: number, scheduledDate?: Date) {
    await requireStringerAuth();
    try {
        const data: {
            status: string;
            stringerId?: number;
            scheduledDate?: Date;
            completedAt: Date | null;
        } = { status, completedAt: null };
        if (stringerId) data.stringerId = stringerId;
        if (scheduledDate) data.scheduledDate = scheduledDate;

        if (status === "Completed") {
            data.completedAt = new Date();
        } else {
            // If reverting status from Completed, remove the completedAt timestamp
            data.completedAt = null;
        }

        await prisma.serviceJob.update({
            where: { id: jobId },
            data
        });

        revalidatePath("/stringer");
        return { success: true };
    } catch (error) {
        console.error("Failed to update status", error);
        return { success: false };
    }
}

export type MaterialUsageData = {
    stringName: string;
    mainsCount: number;
    crossesCount: number;
    totalCount: number;
};

async function computeMaterialUsageReport(
    startDate?: Date,
    endDate?: Date,
    stringName?: string
): Promise<MaterialUsageData[]> {
    const whereClause: {
        status: string;
        completedAt?: { gte?: Date; lte?: Date };
    } = {
        status: "Completed",
    };

    if (startDate || endDate) {
        whereClause.completedAt = {};
        if (startDate) whereClause.completedAt.gte = startDate;
        if (endDate) whereClause.completedAt.lte = endDate;
    }

    const jobs = await prisma.serviceJob.findMany({
        where: whereClause,
        select: {
            stringMain: true,
            stringCross: true,
        },
    });

    const usageMap = new Map<string, MaterialUsageData>();

    jobs.forEach(job => {
        // Record mains
        if (job.stringMain) {
            if (!usageMap.has(job.stringMain)) usageMap.set(job.stringMain, { stringName: job.stringMain, mainsCount: 0, crossesCount: 0, totalCount: 0 });
            const entry = usageMap.get(job.stringMain)!;
            entry.mainsCount++;
            entry.totalCount++;
        }
        // Record crosses
        if (job.stringCross) {
            if (!usageMap.has(job.stringCross)) usageMap.set(job.stringCross, { stringName: job.stringCross, mainsCount: 0, crossesCount: 0, totalCount: 0 });
            const entry = usageMap.get(job.stringCross)!;
            entry.crossesCount++;
            entry.totalCount++;
        }
    });

    let results = Array.from(usageMap.values());

    if (stringName) {
        const lowerFilter = stringName.toLowerCase();
        results = results.filter(r => r.stringName.toLowerCase().includes(lowerFilter));
    }

    // Sort by total usage descending
    results.sort((a, b) => b.totalCount - a.totalCount);
    return results;
}

export async function getMaterialUsageReport(
    startDate?: Date,
    endDate?: Date,
    stringName?: string
): Promise<MaterialUsageData[]> {
    await requireStringerAuth();
    return computeMaterialUsageReport(startDate, endDate, stringName);
}

export async function getRestockAlerts(threshold: number = 10, daysLookback: number = 30): Promise<{ stringName: string, count: number }[]> {
    await requireStringerAuth();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - daysLookback);

    const report = await computeMaterialUsageReport(thirtyDaysAgo, new Date());

    return report
        .filter(item => item.totalCount >= threshold)
        .map(item => ({ stringName: item.stringName, count: item.totalCount }));
}

export async function getJobsForExport(startDate: Date, endDate: Date) {
    await requireStringerAuth();
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);

    // Padding the limit by a couple days to avoid strict timezone boundary issues
    twoYearsAgo.setDate(twoYearsAgo.getDate() - 2);

    if (startDate < twoYearsAgo) {
        throw new Error("Cannot export data older than 2 years.");
    }

    const endOfDay = new Date(endDate);
    endOfDay.setHours(23, 59, 59, 999);

    const jobs = await prisma.serviceJob.findMany({
        where: {
            createdAt: {
                gte: startDate,
                lte: endOfDay
            }
        },
        include: {
            racquetModel: {
                include: {
                    manufacturer: true
                }
            },
            stringer: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });

    return jobs.map(job => ({
        ...job,
        mainsTensionLbs: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : null,
        crossTensionLbs: job.crossTensionLbs ? Number(job.crossTensionLbs) : null,
    }));
}
