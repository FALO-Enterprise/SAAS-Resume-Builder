// apps/backend/prisma/seed.ts
import { randomUUID } from "node:crypto"
import prisma from "./prisma.service"

async function main() {

    await prisma.template.upsert({
        where: { id: 'minimal' },
        create: {
            id: 'minimal',
            name: 'Professional ATS',
            thumbnail: null,
            isPremium: false,
        },
        update: {
            name: 'Professional ATS',
            isPremium: false,
        },
    })

    const plans = [
        {
            name: 'FREE',
            price: 0,
            maxResumes: 1,
            hasWatermark: true,
            canExportPDF: true,
            canUseTemplates: false,
        },
        {
            name: 'PRO',
            price: 9.99,
            maxResumes: 3,
            hasWatermark: false,
            canExportPDF: true,
            canUseTemplates: true,
        },
        {
            name: 'ENTERPRISE',
            price: 29.99,
            maxResumes: 6,
            hasWatermark: false,
            canExportPDF: true,
            canUseTemplates: true,
        },
    ] as const;

    // Upsert so plan entitlements stay synchronized when the seed is rerun.
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            create: {
                id: randomUUID(),
                ...plan,
                updatedAt: new Date(),
            },
            update: {
                ...plan,
                updatedAt: new Date(),
            },
        });
    }

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
