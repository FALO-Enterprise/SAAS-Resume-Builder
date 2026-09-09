import assert from "node:assert/strict";
import test from "node:test";
import type { AxiosAdapter, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "@/lib/api/client";
import {
  exportResume,
  getResumeTemplateMetadata,
  updateCurrentResumeTemplate,
} from "@/lib/resume-preview-api";

type StubbedResponse = {
  status: number;
  data: unknown;
  headers?: Record<string, string>;
};

async function withStubbedTransport(
  respond: (config: InternalAxiosRequestConfig) => StubbedResponse,
  run: (seen: InternalAxiosRequestConfig[]) => Promise<void>,
) {
  const originalAdapter = apiClient.defaults.adapter;
  const originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const seen: InternalAxiosRequestConfig[] = [];

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

  const adapter: AxiosAdapter = async (config) => {
    seen.push(config);
    const stub = respond(config);
    return {
      data: stub.data,
      status: stub.status,
      statusText: String(stub.status),
      headers: stub.headers ?? {},
      config,
    } as never;
  };
  apiClient.defaults.adapter = adapter;

  try {
    await run(seen);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
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
}

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
  await withStubbedTransport(
    () => ({
      status: 200,
      data: {
        success: true,
        data: {
          id: "resume-1",
          title: "Taylor Resume",
          templateId: "executive",
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      },
    }),
    async (seen) => {
      const result = await updateCurrentResumeTemplate(
        "Taylor Resume",
        "executive",
      );

      const [config] = seen;
      assert.equal(config.url, "/api/resumes/current");
      assert.equal(config.method, "put");
      assert.equal(
        config.headers.get("Authorization"),
        "Bearer test-token",
      );
      assert.deepEqual(JSON.parse(String(config.data)), {
        title: "Taylor Resume",
        templateId: "executive",
      });
      assert.equal(result.templateId, "executive");
    },
  );
});

test("targets an explicit resume id through a query parameter", async () => {
  await withStubbedTransport(
    () => ({
      status: 200,
      data: {
        success: true,
        data: {
          id: "resume-9",
          title: "Taylor Resume",
          templateId: "minimal",
          updatedAt: "2026-08-13T12:00:00.000Z",
        },
      },
    }),
    async (seen) => {
      await updateCurrentResumeTemplate(
        "Taylor Resume",
        "minimal",
        undefined,
        "resume-9",
      );
      assert.deepEqual(seen[0].params, { resumeId: "resume-9" });
    },
  );
});

test("surfaces the backend message when a template update is rejected", async () => {
  await withStubbedTransport(
    () => ({
      status: 403,
      data: {
        success: false,
        error: {
          statusCode: 403,
          message: "Your plan does not include this template",
        },
      },
    }),
    async () => {
      await assert.rejects(
        () => updateCurrentResumeTemplate("Taylor Resume", "executive"),
        (error: Error) => {
          assert.ok(error instanceof Error);
          assert.equal(error.message, "Your plan does not include this template");
          return true;
        },
      );
    },
  );
});

test("surfaces the backend message when resume export is rejected", async () => {
  await withStubbedTransport(
    () => ({
      status: 403,
      data: new Blob(
        [
          JSON.stringify({
            success: false,
            error: {
              statusCode: 403,
              message: "Your plan does not include JPG export",
            },
          }),
        ],
        { type: "application/json" },
      ),
    }),
    async () => {
      await assert.rejects(
        () => exportResume("resume-1", "jpg"),
        (error: Error) => {
          assert.equal(error.message, "Your plan does not include JPG export");
          return true;
        },
      );
    },
  );
});

test("keeps the response status when the export error is not JSON", async () => {
  await withStubbedTransport(
    () => ({
      status: 500,
      data: new Blob(["internal server error"], { type: "text/plain" }),
    }),
    async () => {
      await assert.rejects(
        () => exportResume("resume-1", "jpg"),
        (error: Error) => {
          assert.equal(error.message, "Failed to export resume (500)");
          return true;
        },
      );
    },
  );
});

test("rejects an export whose body is not the requested format", async () => {
  await withStubbedTransport(
    () => ({
      status: 200,
      data: new Blob(["not a pdf"], { type: "text/html" }),
      headers: { "content-type": "text/html" },
    }),
    async () => {
      await assert.rejects(
        () => exportResume("resume-1", "pdf"),
        (error: Error) => {
          assert.equal(
            error.message,
            "The server returned an invalid PDF response",
          );
          return true;
        },
      );
    },
  );
});
