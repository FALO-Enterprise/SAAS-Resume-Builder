import { Resume } from './resume.schema';
import prisma from '../../prisma/prisma.service';

export class ResumeRepository {
    private prismaResume = prisma.resume;

    findAll(query: Record<string, unknown> = {}): Promise<Resume[]> {
        return this.prismaResume.findMany({ where: query });
    }

    findById(id: string): Promise<Resume | null> {
        return this.prismaResume.findUnique({
            where: {
                id,
            },
        });
    }

    create(title: string, templateId: string, userId: string): Promise<Resume> {
        return this.prismaResume.create({
            data: {
                title,
                templateId,
                userId,
            },
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
