import assert from "node:assert/strict";
import test from "node:test";

import {
  hasPendingResumeGeneration,
  isResumeGenerationDisabled,
} from "./resume-preview-state";

const generatedState = {
  generatedPurpose: "job",
  generatedTemplateId: "minimal",
};

test("has no pending generation when purpose and template match", () => {
  assert.equal(
    hasPendingResumeGeneration({
      ...generatedState,
      draftPurpose: "job",
      draftTemplateId: "minimal",
    }),
    false,
  );
});

test("detects a pending template change", () => {
  assert.equal(
    hasPendingResumeGeneration({
      ...generatedState,
      draftPurpose: "job",
      draftTemplateId: "executive",
    }),
    true,
  );
});

test("clears the pending state when the original template is selected again", () => {
  assert.equal(
    hasPendingResumeGeneration({
      ...generatedState,
      draftPurpose: "job",
      draftTemplateId: "minimal",
    }),
    false,
  );
});

test("clears the pending state after the selected template is generated", () => {
  assert.equal(
    hasPendingResumeGeneration({
      generatedPurpose: "job",
      generatedTemplateId: "executive",
      draftPurpose: "job",
      draftTemplateId: "executive",
    }),
    false,
  );
});

test("detects a pending purpose change", () => {
  assert.equal(
    hasPendingResumeGeneration({
      ...generatedState,
      draftPurpose: "promotion",
      draftTemplateId: "minimal",
    }),
    true,
  );
});

test("keeps the action disabled while generation is running", () => {
  assert.equal(
    isResumeGenerationDisabled(
      {
        ...generatedState,
        draftPurpose: "job",
        draftTemplateId: "executive",
      },
      true,
    ),
    true,
  );
});
