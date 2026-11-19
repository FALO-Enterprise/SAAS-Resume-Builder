import type { z } from 'zod';
import type { resumeContentSchema } from '../../dashboard/dashboard.schema';
import type { resumeAiEnhancementSchema } from './resume-ai.schema';

export type ResumeAiInput = z.infer<typeof resumeContentSchema>;
export type ResumeAiEnhancement = z.infer<typeof resumeAiEnhancementSchema>;

export interface ResumeAiGenerator {
    enhance(input: ResumeAiInput, userId: string, purpose?: string): Promise<ResumeAiEnhancement>;
}

