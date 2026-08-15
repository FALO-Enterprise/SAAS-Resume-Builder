import { CreateResumeDTO, UpdateResumeDTO } from './types/resume.dto';
import { Resume } from './resume.schema';
import { ResumeRepository } from './resume.repository';
import type { ResumeGenerationDTO } from './util/resume.schema';
import { resolveResumeTemplate } from './resume-template.registry';

class ResumeService {
    private repository = new ResumeRepository();

    getResumes(_page: number, _limit: number): Promise<Resume[]> {
        return this.repository.findAll({});
    }

    getResume(id: string): Promise<Resume | null> {
        return this.repository.findById(id);
    }

    public createResume(payload: CreateResumeDTO): Promise<Resume> {
        return this.repository.create(payload.title, payload.templateId, payload.userId);
    }

    public upsertCurrentResume(userId: string, payload: ResumeGenerationDTO): Promise<Resume> {
        const template = resolveResumeTemplate(payload.templateId);
        if (!template) throw new Error('Template not found');
        return this.repository.upsertForUser(payload.title, template.id, template.name, userId);
    }

    public updateResume(id: string, payload: UpdateResumeDTO): Promise<Resume> {
        return this.repository.update(id, payload.title, payload.templateId);
    }

    deleteResume(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}

export const resumeService = new ResumeService();
