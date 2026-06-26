import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL
});

const prisma = new PrismaClient({ adapter });

export default prisma;


/**
 --> Prisma flow: 
============================================
 .env (DATABASE_URL)
      ↓
    prisma.config.ts  → used for migrations
      ↓
    PrismaPg adapter  → used for queries
      ↓
    PrismaClient      → used in your code
============================================
 */