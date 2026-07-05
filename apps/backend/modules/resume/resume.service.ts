import { CreateResumeDTO, UpdateResumeDTO } from './types/resume.dto';
import { Resume } from './resume.schema';
import { ResumeRepository } from './resume.repository';

class ResumeService {
    private repository = new ResumeRepository();

    getResumes(page: number, limit: number): Promise<Resume[]> {
        return this.repository.findAll({});
    }

    getResume(id: string): Promise<Resume | null> {
        return this.repository.findById(id);
    }

    public createResume(payload: CreateResumeDTO): Promise<Resume> {
        return this.repository.create(payload.title, payload.templateId, payload.userId);
    }

    public updateResume(id: string, payload: UpdateResumeDTO): Promise<Resume> {
        return this.repository.update(id, payload.title, payload.templateId, payload.userId);
    }

    deleteResume(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}

export const resumeService = new ResumeService();
