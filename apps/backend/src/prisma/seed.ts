// apps/backend/prisma/seed.ts
import { randomUUID } from "node:crypto"
import prisma from "./prisma.service"

async function main() {

    // create the plans
    await prisma.plan.createMany({
        data: [
            {
                id: randomUUID(),
                name: 'FREE',
                price: 0,
                maxResumes: 1,
                hasWatermark: true,
                canExportPDF: false,
                canUseTemplates: false,
                updatedAt: new Date(),

            },
            {
                id: randomUUID(),
                updatedAt: new Date(),
                name: 'PRO',
                price: 9.99,
                maxResumes: 3,
                hasWatermark: false,
                canExportPDF: true,
                canUseTemplates: true,
            },
            {
                id: randomUUID(),
                updatedAt: new Date(),
                name: 'ENTERPRISE',
                price: 29.99,
                maxResumes: 6,
                hasWatermark: false,
                canExportPDF: true,
                canUseTemplates: true,
            },
        ],
        skipDuplicates: true,
    })

    console.log('Plans seeded successfully!')
}

main()
    .catch((e) => {
        console.error('Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })