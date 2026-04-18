import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from './generated/prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

function createPrisma() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
  return new PrismaClient({ adapter })
}

const prisma = global.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export default prisma
