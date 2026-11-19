export type ResumeGenerationState = {
  draftPurpose: string;
  generatedPurpose: string;
  draftTemplateId: string;
  generatedTemplateId: string;
};

export function hasPendingResumeGeneration({
  draftPurpose,
  generatedPurpose,
  draftTemplateId,
  generatedTemplateId,
}: ResumeGenerationState) {
  return (
    draftPurpose !== generatedPurpose ||
    draftTemplateId !== generatedTemplateId
  );
}

export function isResumeGenerationDisabled(
  state: ResumeGenerationState,
  isGenerating: boolean,
) {
  return isGenerating || !hasPendingResumeGeneration(state);
}
