import test from "node:test";
import assert from "node:assert/strict";
import { RESUME_TEMPLATE_DEFINITIONS } from "@resumax/shared-types";
import { resolveResumeTemplate } from "./resume-template.registry";
import { resumeExportSchema } from "./resume-export.schema";

test("resolves the stable Classic ATS template definition", () => {
  assert.deepEqual(resolveResumeTemplate("minimal"), {
    id: "minimal",
    name: "Classic ATS",
    version: 3,
  });
});

test("accepts every shared gallery template in generation and export", () => {
  for (const template of RESUME_TEMPLATE_DEFINITIONS) {
    assert.deepEqual(resolveResumeTemplate(template.id), template);
    assert.equal(
      resumeExportSchema.safeParse({ templateId: template.id }).success,
      true,
    );
  }
});

test("returns null for an invalid template id", () => {
  assert.equal(resolveResumeTemplate("not-a-template"), null);
  assert.equal(
    resumeExportSchema.safeParse({ templateId: "not-a-template" }).success,
    false,
  );
});
