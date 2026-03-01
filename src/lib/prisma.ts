import { PrismaClient } from '@prisma/client'
import { createClient } from '@libsql/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const prismaClientSingleton = () => {

    // Only use the Turso remote adapter if we actually have the environment variables
    // Otherwise fallback to whatever the schema points to (local sqlite file)
    if (process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN) {
        const libsql = createClient({
            url: process.env.TURSO_DATABASE_URL,
            authToken: process.env.TURSO_AUTH_TOKEN,
        })
        const adapter = new PrismaLibSQL(libsql)
        // @ts-expect-error — adapter IS supported at runtime (see runtime/library.d.ts)
        // but Prisma v5 generated types don't expose it in the public PrismaClientOptions interface
        return new PrismaClient({ adapter })
    }

    return new PrismaClient()
}

declare global {
    var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
