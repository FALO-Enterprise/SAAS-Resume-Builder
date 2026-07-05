import { Prisma } from '@prisma/client';
import { Resume } from './resume.schema';
import prisma from '../../prisma/prisma.service';

export class ResumeRepository {
    private prismaResume = prisma.resume;

    findAll(query: Prisma.ResumeWhereInput = {}): Promise<Resume[]> {
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

    update(id: string, title?: string, templateId?: string, userId?: string): Promise<Resume> {
        const data: Prisma.ResumeUpdateInput = {};

        if (title !== undefined) data.title = title;
        if (templateId !== undefined) data.templateId = templateId;
        if (userId !== undefined) data.userId = userId;

        return this.prismaResume.update({
            where: { id },
            data,
