import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function queryClientHistory(phone: string, months: number | null) {
    const dateFilter: { gte?: Date } = {};
    if (months !== null) {
        const cutoff = new Date();
        cutoff.setMonth(cutoff.getMonth() - months);
        dateFilter.gte = cutoff;
    }

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

    console.log("Jobs found:", jobs.length);
    const seen = new Set<number>();
    const unique: any[] = [];

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

async function main() {
    try {
        const results = await queryClientHistory("0507654321", 18);
        console.log("Results 18mo:", results);
        if (results.length === 0) {
            const allTime = await queryClientHistory("0507654321", null);
            console.log("Results all-time:", allTime);
        }
    } catch (err) {
        console.error("ERROR:", err);
    } finally {
        await prisma.$disconnect();
    }
}
main();
