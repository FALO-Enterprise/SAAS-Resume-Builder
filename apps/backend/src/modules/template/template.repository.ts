import { Template } from '@prisma/client';
import prisma from '../../prisma/prisma.service';

export class TemplateRepository {
    private prismaTemplate = prisma.template;

    findAll(query: Record<string, unknown> = {}): Promise<Template[]> {
        return this.prismaTemplate.findMany({ where: query });
    }

    findById(id: string): Promise<Template | null> {
        return this.prismaTemplate.findUnique({
            where: { id },
        });
    }

    create(name: string, thumbnail?: string | null, isPremium = false): Promise<Template> {
        return this.prismaTemplate.create({
            data: {
                name,
                thumbnail,
                isPremium,
            },
        });
    }

    update(id: string, name?: string, thumbnail?: string | null, isPremium?: boolean): Promise<Template> {
        const data: Record<string, unknown> = {};

        if (name !== undefined) data.name = name;
        if (thumbnail !== undefined) data.thumbnail = thumbnail;
        if (isPremium !== undefined) data.isPremium = isPremium;

        return this.prismaTemplate.update({
            where: { id },
            data,
        });
    }

    async delete(id: string): Promise<boolean> {
        const template = await this.findById(id);
        if (!template) return false;

        await this.prismaTemplate.delete({
            where: { id },
        });

        return true;
    }
}
