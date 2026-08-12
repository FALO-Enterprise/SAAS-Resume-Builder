import assert from "node:assert/strict";
import test from "node:test";
import { getResumeApiErrorMessage } from "@/lib/resume-preview-api";

test("surfaces the backend message when resume export is rejected", async () => {
  const response = new Response(
    JSON.stringify({
      success: false,
      error: {
        statusCode: 403,
        message: "Your plan does not include JPG export",
      },
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    },
  );

  assert.equal(
    await getResumeApiErrorMessage(response, "Failed to export resume"),
    "Your plan does not include JPG export",
  );
});

test("keeps the response status when the export error is not JSON", async () => {
  const response = new Response("internal server error", { status: 500 });

  assert.equal(
    await getResumeApiErrorMessage(response, "Failed to export resume"),
    "Failed to export resume (500)",
  );
});
