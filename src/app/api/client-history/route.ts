import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// TODO: Add Upstash rate limiting before shipping to production.
// See docs/Client-Recognition.md §Security Requirements.
// Example:
//   import { Ratelimit } from "@upstash/ratelimit";
//   import { Redis } from "@upstash/redis";
//   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "60 s") });

/**
 * GET /api/client-history?phone=05XXXXXXXX
 *
 * Returns the client's last 3 unique racquet setups (grouped by modelId).
 * Only equipment fields are returned — never PII (name, etc.).
 */
export async function GET(request: NextRequest) {
    const phone = request.nextUrl.searchParams.get("phone");

    // Validate: must be a 10-digit Israeli mobile number
    if (!phone || !/^05\d{8}$/.test(phone)) {
        return NextResponse.json(
            { error: "Invalid or missing phone parameter" },
            { status: 400 }
        );
    }

    try {
        // Try 18-month window first
        let results = await queryClientHistory(phone, 18);

        // Fallback to all-time if 18 months returned nothing
        if (results.length === 0) {
            results = await queryClientHistory(phone, null);
        }

        return NextResponse.json(results);
    } catch (error) {
        console.error("client-history API error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

/**
 * Query the last 3 unique racquet models for a given phone number.
 * Groups by modelId so a client with "Pure Drive 52lbs" and "Pure Drive 53lbs"
 * only sees one chip (the most recent tension).
 *
 * @param phone   - The client's phone number
 * @param months  - How many months back to search, or null for all-time
 */
async function queryClientHistory(phone: string, months: number | null) {
    // Build the date filter
    const dateFilter: { gte?: Date } = {};
    if (months !== null) {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        dateFilter.gte = cutoff;
    }

    // Prisma doesn't natively support GROUP BY with aggregates on related fields,
    // so we fetch the relevant jobs ordered by recency and de-duplicate in JS.
    const jobs = await prisma.serviceJob.findMany({
        where: {
            clientPhone: phone,
            status: { not: "CANCELLED" },
            modelId: { not: null },
            ...(dateFilter.gte ? { createdAt: { gte: dateFilter.gte } } : {}),
        },
        orderBy: { createdAt: "desc" },
        include: {
            racquetModel: {
                include: {
                    manufacturer: true,
                },
            },
        },
    });

    // De-duplicate by modelId — keep only the most recent entry per model
    const seen = new Set<number>();
    const unique: Array<{
        modelId: number;
        modelName: string;
        manufacturerId: number;
        manufacturerName: string;
        stringTypes: string | null;
        mainsTensionLbs: number | null;
        crossTensionLbs: number | null;
        lastUsed: Date;
    }> = [];

    for (const job of jobs) {
        if (unique.length >= 3) break;
        if (!job.modelId || !job.racquetModel) continue;
        if (seen.has(job.modelId)) continue;

        seen.add(job.modelId);
        unique.push({
            modelId: job.modelId,
            modelName: job.racquetModel.name,
            manufacturerId: job.racquetModel.manufacturer.id,
            manufacturerName: job.racquetModel.manufacturer.name,
            stringTypes: job.stringTypes,
            mainsTensionLbs: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : null,
            crossTensionLbs: job.crossTensionLbs ? Number(job.crossTensionLbs) : null,
            lastUsed: job.createdAt,
        });
    }

    return unique;
}
