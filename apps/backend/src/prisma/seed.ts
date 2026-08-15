// apps/backend/prisma/seed.ts
import { randomUUID } from "node:crypto"
import { RESUME_TEMPLATE_DEFINITIONS } from "@resumax/shared-types"
import prisma from "./prisma.service"

const TEMPLATE_METADATA: Record<string, { thumbnail: string; isPremium: boolean }> = {
    executive: {
        thumbnail: "https://i.imgur.com/oPsyIDT.png",
        isPremium: true,
    },
    developer: {
        thumbnail: "https://i.imgur.com/UFjkAoq.png",
        isPremium: false,
    },
    director: {
        thumbnail: "https://i.imgur.com/bIVtQW4.png",
        isPremium: true,
    },
    minimal: {
        thumbnail: "https://i.imgur.com/KnsEIYe.png",
        isPremium: false,
    },
    academic: {
        thumbnail: "https://i.imgur.com/cL8Rls0.png",
        isPremium: false,
    },
    global: {
        thumbnail: "https://i.imgur.com/uaye0sJ.png",
        isPremium: true,
    },
};

async function main() {
    for (const template of RESUME_TEMPLATE_DEFINITIONS) {
        const meta = TEMPLATE_METADATA[template.id] ?? { thumbnail: null, isPremium: false };
        await prisma.template.upsert({
            where: { id: template.id },
            create: {
                id: template.id,
                name: template.name,
                thumbnail: meta.thumbnail,
                isPremium: meta.isPremium,
            },
            update: {
                name: template.name,
                thumbnail: meta.thumbnail,
                isPremium: meta.isPremium,
            },
        });
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
