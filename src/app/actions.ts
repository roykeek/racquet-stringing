"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

    // Set highly simplified session cookie for MVP
    const cookieStore = await cookies();
    cookieStore.set("stringerAuth", String(stringer.id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24 * 7, // 1 week
        path: "/",
    });

    return { success: true };
}

export async function logoutStringer() {
    const cookieStore = await cookies();
    cookieStore.delete("stringerAuth");
}

export async function addStringer(name: string, passwordPlain: string) {
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

export async function getJobsForDashboard() {
    return prisma.serviceJob.findMany({
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
}

export async function updateJobStatus(jobId: number, status: string, stringerId?: number, scheduledDate?: Date) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data: any = { status };
        if (stringerId) data.stringerId = stringerId;
        if (scheduledDate) data.scheduledDate = scheduledDate;

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

