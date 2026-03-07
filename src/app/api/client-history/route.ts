import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Initialize rate limiter if env vars are present
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

let ratelimit: Ratelimit | null = null;
if (redisUrl && redisToken) {
    ratelimit = new Ratelimit({
        redis: new Redis({
            url: redisUrl,
            token: redisToken,
        }),
        limiter: Ratelimit.slidingWindow(5, "60 s"),
        analytics: true,
    });
}

/**
 * GET /api/client-history?phone=05XXXXXXXX
 *
 * Returns the client's last 3 unique racquet setups (grouped by modelId).
 * Only equipment fields are returned — never PII (name, etc.).
 * Protected by strict rate limiting to prevent phone number enumeration.
 */
export async function GET(request: NextRequest) {
    try {
        // 1. Rate Limiting Check
        if (ratelimit) {
            try {
                // Extract IP (works locally and on Vercel)
                // NextRequest.ip is only available in Edge runtime, so we fall back to headers
                const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
                const { success, limit, remaining, reset } = await ratelimit.limit(`history_api_${ip}`);

                if (!success) {
                    console.warn(`Rate limit exceeded for IP: ${ip}`);
                    return NextResponse.json(
                        { error: "Too many requests. Please try again later." },
                        {
                            status: 429,
                            headers: {
                                "X-RateLimit-Limit": limit.toString(),
                                "X-RateLimit-Remaining": remaining.toString(),
                                "X-RateLimit-Reset": reset.toString(),
                            },
                        }
                    );
                }
            } catch (rlError) {
                console.warn("Rate limit check failed (bypassing):", rlError);
                // Fail-open: if Redis throws an error, allow the request to proceed.
            }
        } else {
            console.warn("Upstash Redis credentials missing — rate limiting is DISABLED.");
        }

        // 2. Phone Validation
        const phone = request.nextUrl.searchParams.get("phone");

        // Validate: must be a 10-digit Israeli mobile number
        if (!phone || !/^05\d{8}$/.test(phone)) {
            return NextResponse.json(
                { error: "Invalid or missing phone parameter" },
                { status: 400 }
            );
        }

        // 3. Query Database
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
        stringMain: string | null;
        stringCross: string | null;
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
            stringMain: job.stringMain,
            stringCross: job.stringCross,
            mainsTensionLbs: job.mainsTensionLbs ? Number(job.mainsTensionLbs) : null,
            crossTensionLbs: job.crossTensionLbs ? Number(job.crossTensionLbs) : null,
            lastUsed: job.createdAt,
        });
    }

    return unique;
}
