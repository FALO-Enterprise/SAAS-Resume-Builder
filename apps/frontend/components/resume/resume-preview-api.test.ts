import assert from "node:assert/strict";
import test from "node:test";
import {
  getResumeApiErrorMessage,
  getResumeTemplateMetadata,
  updateCurrentResumeTemplate,
} from "@/lib/resume-preview-api";

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

test("maps preview metadata for each live template", () => {
  assert.deepEqual(getResumeTemplateMetadata("minimal"), {
    id: "minimal",
    name: "Classic ATS",
    version: 3,
    thumbnailUrl: "https://i.imgur.com/glF9QYl.png",
    supportsPhoto: false,
  });
  assert.equal(getResumeTemplateMetadata("executive").name, "Executive Teal");
  assert.equal(
    getResumeTemplateMetadata("developer").name,
    "Developer Sidebar",
  );
});

test("persists the chosen template through the current-resume endpoint", async () => {
  const originalFetch = globalThis.fetch;
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let requestUrl = "";
  let requestInit: RequestInit | undefined;

  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key: string) {
        return key === "resumax_token" ? "test-token" : null;
      },
    },
  });
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: globalThis,
  });
  globalThis.fetch = (async (url, init) => {
    requestUrl = String(url);
    requestInit = init;
    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: "resume-1",
          title: "Taylor Resume",
          templateId: "executive",
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  try {
    const result = await updateCurrentResumeTemplate(
      "Taylor Resume",
      "executive",
    );

    assert.match(requestUrl, /\/api\/resumes\/current$/);
    assert.equal(requestInit?.method, "PUT");
    assert.equal(
      (requestInit?.headers as Record<string, string>).Authorization,
      "Bearer test-token",
    );
    assert.deepEqual(JSON.parse(String(requestInit?.body)), {
      title: "Taylor Resume",
      templateId: "executive",
    });
    assert.equal(result.templateId, "executive");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalStorage) {
      Object.defineProperty(globalThis, "localStorage", originalStorage);
    } else {
      Reflect.deleteProperty(globalThis, "localStorage");
    }
    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  }
});
