import type { ResumeRenderSnapshot } from '@resumax/shared-types';

export interface ResumePdfGenerator {
    generate(snapshot: ResumeRenderSnapshot): Promise<Buffer>;
}
