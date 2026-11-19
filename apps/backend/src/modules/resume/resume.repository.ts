import { Resume } from './resume.schema';
import prisma from '../../prisma/prisma.service';

export class ResumeRepository {
    private prismaResume = prisma.resume;

    findAll(query: Record<string, unknown> = {}): Promise<Resume[]> {
        return this.prismaResume.findMany({
            where: query,
            orderBy: { updatedAt: 'desc' },
        });
    }

    findById(id: string): Promise<Resume | null> {
        return this.prismaResume.findUnique({
            where: {
                id,
            },
        });
    }

    async findOwnedById(id: string, userId: string): Promise<Resume | null> {
        if (id && id !== 'current' && id !== 'resume-123') {
            const exact = await this.prismaResume.findFirst({ where: { id, userId } });
            if (exact) return exact;
        }
        return this.prismaResume.findFirst({ where: { userId } });
    }

    async create(title: string, templateId: string, userId: string): Promise<Resume> {
        await prisma.template.upsert({
            where: { id: templateId },
            create: { id: templateId, name: templateId, isPremium: false },
            update: {},
        });

        return this.prismaResume.create({
            data: {
                title,
                templateId,
                userId,
            },
        });
    }

    async upsertForUser(title: string, templateId: string, templateName: string, userId: string, resumeId?: string): Promise<Resume> {
        await prisma.template.upsert({
            where: { id: templateId },
            create: { id: templateId, name: templateName, isPremium: false },
            update: { name: templateName },
        });

        if (resumeId && resumeId !== 'current' && resumeId !== 'resume-123') {
            const exact = await this.prismaResume.findFirst({
                where: { id: resumeId, userId },
            });
            if (exact) {
                return this.prismaResume.update({
                    where: { id: exact.id },
                    data: { title, templateId },
                });
            }
        }

        const existing = await this.prismaResume.findFirst({
            where: { userId },
            orderBy: { updatedAt: 'desc' },
        });

        if (existing) {
            return this.prismaResume.update({
                where: { id: existing.id },
                data: { title, templateId },
            });
        }

        return this.prismaResume.create({
            data: { title, templateId, userId },
        });
    }

    update(id: string, title?: string, templateId?: string): Promise<Resume> {
        const data: Record<string, unknown> = {};

        if (title !== undefined) data.title = title;
        if (templateId !== undefined) {
            data.template = {
                connect: {
                    id: templateId
                }
            }
        };

        if (Object.keys(data).length === 0) {
            return this.findById(id) as Promise<Resume>;
        }

        return this.prismaResume.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<boolean> {
        const resume = await this.findById(id);
        if (!resume) {
            return false;
        }

        await this.prismaResume.delete({
            where: { id },
        });

        return true;
    }
}
