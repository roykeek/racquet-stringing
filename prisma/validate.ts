/**
 * prisma/validate.ts
 * Post-DB-change validation script.
 * Run with:  npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/validate.ts
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface ValidationResult {
    check: string
    status: 'PASS' | 'FAIL'
    detail: string
}

async function runValidation(): Promise<void> {
    const results: ValidationResult[] = []
    let hasFailures = false

    console.log('\n🔍 Running DB Validation Checks...\n')

    // ── Check 1: Manufacturers exist ──────────────────────────────────
    const manufacturers = await prisma.manufacturer.findMany({
        include: { racquetModels: true },
        orderBy: { name: 'asc' },
    })

    const mfrCount = manufacturers.length
    results.push({
        check: 'Manufacturers exist',
        status: mfrCount > 0 ? 'PASS' : 'FAIL',
        detail: `${mfrCount} manufacturer(s) found`,
    })

    // ── Check 2: Every manufacturer has at least one model ────────────
    const emptyMfrs = manufacturers.filter((m) => m.racquetModels.length === 0)
    results.push({
        check: 'All manufacturers have models',
        status: emptyMfrs.length === 0 ? 'PASS' : 'FAIL',
        detail:
            emptyMfrs.length === 0
                ? 'All manufacturers have ≥1 model'
                : `Empty: ${emptyMfrs.map((m) => m.name).join(', ')}`,
    })

    // ── Check 3: Total model count ────────────────────────────────────
    const totalModels = await prisma.racquetModel.count()
    results.push({
        check: 'Models exist',
        status: totalModels > 0 ? 'PASS' : 'FAIL',
        detail: `${totalModels} model(s) found`,
    })

    // ── Check 4: No orphaned models (FK integrity) ────────────────────
    const orphaned = await prisma.racquetModel.findMany({
        where: { manufacturer: undefined },
    })
    // Alternative: check if any manufacturerId doesn't match an existing manufacturer
    const mfrIds = new Set(manufacturers.map((m) => m.id))
    const allModels = await prisma.racquetModel.findMany()
    const orphanedModels = allModels.filter((m) => !mfrIds.has(m.manufacturerId))
    results.push({
        check: 'No orphaned models (FK integrity)',
        status: orphanedModels.length === 0 ? 'PASS' : 'FAIL',
        detail:
            orphanedModels.length === 0
                ? 'All models linked to valid manufacturer'
                : `${orphanedModels.length} orphan(s) found`,
    })

    // ── Check 5: No duplicate models per manufacturer ─────────────────
    const dupes: string[] = []
    for (const mfr of manufacturers) {
        const names = mfr.racquetModels.map((m) => m.name)
        const seen = new Set<string>()
        for (const n of names) {
            if (seen.has(n)) dupes.push(`${mfr.name} → ${n}`)
            seen.add(n)
        }
    }
    results.push({
        check: 'No duplicate models per manufacturer',
        status: dupes.length === 0 ? 'PASS' : 'FAIL',
        detail:
            dupes.length === 0
                ? 'No duplicates'
                : `Duplicates: ${dupes.join(', ')}`,
    })

    // ── Check 6: At least one stringer exists ─────────────────────────
    const stringerCount = await prisma.stringer.count()
    results.push({
        check: 'At least one stringer exists',
        status: stringerCount > 0 ? 'PASS' : 'FAIL',
        detail: `${stringerCount} stringer(s) found`,
    })

    // ── Print Results ─────────────────────────────────────────────────
    console.log('─'.repeat(60))
    for (const r of results) {
        const icon = r.status === 'PASS' ? '✅' : '❌'
        console.log(`${icon}  ${r.check}`)
        console.log(`   ${r.detail}`)
        if (r.status === 'FAIL') hasFailures = true
    }
    console.log('─'.repeat(60))

    // ── Summary table: models per manufacturer ────────────────────────
    console.log('\n📋 Models per Manufacturer:\n')
    for (const mfr of manufacturers) {
        console.log(`   ${mfr.name}: ${mfr.racquetModels.length} model(s)`)
        for (const mdl of mfr.racquetModels) {
            console.log(`      • ${mdl.name}`)
        }
    }

    console.log('\n' + '─'.repeat(60))
    if (hasFailures) {
        console.log('⚠️  VALIDATION FAILED — see ❌ items above')
        process.exitCode = 1
    } else {
        console.log('✅ ALL CHECKS PASSED')
    }
    console.log('─'.repeat(60) + '\n')
}

runValidation()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
