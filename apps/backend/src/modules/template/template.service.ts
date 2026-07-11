import { CreateTemplateDTO, UpdateTemplateDTO } from './types/template.dto';
import { Template } from './template.schema';
import { TemplateRepository } from './template.repository';

class TemplateService {
    private repository = new TemplateRepository();

    getTemplates(): Promise<Template[]> {
        return this.repository.findAll({});
    }

    getTemplate(id: string): Promise<Template | null> {
        return this.repository.findById(id);
    }

    createTemplate(payload: CreateTemplateDTO): Promise<Template> {
        return this.repository.create(payload.name, payload.thumbnail ?? null, payload.isPremium ?? false);
    }

    updateTemplate(id: string, payload: UpdateTemplateDTO): Promise<Template> {
        return this.repository.update(id, payload.name, payload.thumbnail ?? undefined, payload.isPremium);
    }

    deleteTemplate(id: string): Promise<boolean> {
        return this.repository.delete(id);
    }
}

export const templateService = new TemplateService();
