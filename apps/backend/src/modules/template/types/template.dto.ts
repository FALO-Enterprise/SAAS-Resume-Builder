import { Template } from '../template.schema';

export type CreateTemplateDTO = Pick<Template, 'name' | 'thumbnail' | 'isPremium'>;
export type UpdateTemplateDTO = Partial<CreateTemplateDTO>;
export type TemplateResponseDTO = Template;
