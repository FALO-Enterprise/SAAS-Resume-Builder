// apps/backend/prisma/seed.ts
import { randomUUID } from "node:crypto"
import { RESUME_TEMPLATE_DEFINITIONS } from "@resumax/shared-types"
import prisma from "./prisma.service"

async function main() {

    for (const template of RESUME_TEMPLATE_DEFINITIONS) {
        await prisma.template.upsert({
            where: { id: template.id },
            create: {
                id: template.id,
                name: template.name,
                thumbnail: null,
                isPremium: false,
            },
            update: {
                name: template.name,
                isPremium: false,
            },
        })
    }

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
