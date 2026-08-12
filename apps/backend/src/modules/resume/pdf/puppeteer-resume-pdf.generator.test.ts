import test from 'node:test';
import assert from 'node:assert/strict';
import type { Browser, Page } from 'puppeteer';
import {
    DEFAULT_RESUME_CUSTOMIZATION,
    RESUME_TEMPLATE_DEFINITIONS,
    type ResumeRenderSnapshot,
} from '@resumax/shared-types';
import {
    PuppeteerResumePdfGenerator,
    resolveBrowserExecutablePath,
} from './puppeteer-resume-pdf.generator';
import { RenderSnapshotStore } from './render-snapshot.store';

const snapshot: ResumeRenderSnapshot = {
    resumeId: 'resume-1', title: 'Test Resume', templateId: 'minimal', templateVersion: RESUME_TEMPLATE_DEFINITIONS[0].version,
    createdAt: new Date().toISOString(), customization: DEFAULT_RESUME_CUSTOMIZATION,
    content: {
        contact: { fullName: 'Test User', title: '', email: '', phone: '', location: '', linkedin: '', github: '', portfolio: '' },
        summary: '', skillGroups: [], experience: [], projects: [], education: [], certifications: [], skills: [],
    },
};

test('awaits Puppeteer browser discovery before validating executable paths', async () => {
    const inspectedCandidates: string[] = [];
    const executablePath = await resolveBrowserExecutablePath({
        configuredPath: 'missing-configured-browser',
        resolveManagedPath: async () => {
            await Promise.resolve();
            return 'managed-browser';
        },
        platform: 'linux',
        environment: {},
        pathExists: (candidate) => {
            inspectedCandidates.push(candidate);
            return candidate === 'managed-browser';
        },
    });

    assert.equal(executablePath, 'managed-browser');
    assert.deepEqual(inspectedCandidates, ['missing-configured-browser', 'managed-browser']);
});

test('reports how to configure Chrome when no executable is available', async () => {
    await assert.rejects(
        resolveBrowserExecutablePath({
            configuredPath: '',
            resolveManagedPath: async () => { throw new Error('browser cache is empty'); },
            platform: 'linux',
            environment: {},
            pathExists: () => false,
        }),
        /PUPPETEER_EXECUTABLE_PATH/,
    );
});

test('closes a Puppeteer page when rendering fails', async () => {
    let pageClosed = false;
    const page = {
        setDefaultNavigationTimeout() {},
        setDefaultTimeout() {},
        setViewport: async () => {},
        emulateMediaType: async () => {},
        setRequestInterception: async () => {},
        on() { return this; },
        goto: async () => { throw new Error('navigation failed'); },
        close: async () => { pageClosed = true; },
    } as unknown as Page;
    const browser = {
        connected: true,
        newPage: async () => page,
        on() { return this; },
        close: async () => {},
    } as unknown as Browser;
    const generator = new PuppeteerResumePdfGenerator(
        new RenderSnapshotStore(),
        async () => browser,
        1,
        100,
    );

    await assert.rejects(generator.generate(snapshot), /navigation failed/);
    assert.equal(pageClosed, true);
    await generator.dispose();
});

test('closes a Puppeteer page after successful PDF generation', async () => {
    let pageClosed = false;
    let viewport: unknown;
    let mediaType: unknown;
    let readySelector: unknown;
    let readyOptions: unknown;
    let pdfOptions: unknown;
    const page = {
        setDefaultNavigationTimeout() {},
        setDefaultTimeout() {},
        setViewport: async (value: unknown) => { viewport = value; },
        emulateMediaType: async (value: unknown) => { mediaType = value; },
        setRequestInterception: async () => {},
        on() { return this; },
        goto: async () => null,
        waitForSelector: async (selector: string, options: unknown) => {
            readySelector = selector;
            readyOptions = options;
        },
        evaluate: async () => undefined,
        pdf: async (options: unknown) => {
            pdfOptions = options;
            return new Uint8Array(Buffer.from('%PDF-success'));
        },
        close: async () => { pageClosed = true; },
    } as unknown as Page;
    const browser = {
        connected: true,
        newPage: async () => page,
        on() { return this; },
        close: async () => {},
    } as unknown as Browser;
    const generator = new PuppeteerResumePdfGenerator(new RenderSnapshotStore(), async () => browser, 1, 100);

    const pdf = await generator.generate(snapshot);
    assert.equal(pdf.toString(), '%PDF-success');
    assert.deepEqual(viewport, { width: 794, height: 1123, deviceScaleFactor: 2 });
    assert.equal(mediaType, 'print');
    assert.equal(readySelector, '[data-resume-render-ready="true"] [data-resume-template]');
    assert.deepEqual(readyOptions, { visible: true });
    assert.deepEqual(pdfOptions, {
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
    });
    assert.equal(pageClosed, true);
    await generator.dispose();
});

test('captures a high-resolution JPG from the same print-ready resume element', async () => {
    let pageClosed = false;
    let queriedSelector: unknown;
    let screenshotOptions: unknown;
    const renderEvents: string[] = [];
    const resumeElement = {
        screenshot: async (options: unknown) => {
            renderEvents.push('screenshot');
            screenshotOptions = options;
            return new Uint8Array(Buffer.from('JPG-success'));
        },
    };
    const page = {
        setDefaultNavigationTimeout() {},
        setDefaultTimeout() {},
        setViewport: async () => {},
        emulateMediaType: async () => {},
        setRequestInterception: async () => {},
        on() { return this; },
        goto: async () => { renderEvents.push('goto'); },
        waitForSelector: async () => { renderEvents.push('ready'); },
        evaluate: async () => { renderEvents.push('assets'); },
        $: async (selector: string) => {
            queriedSelector = selector;
            return resumeElement;
        },
        close: async () => { pageClosed = true; },
    } as unknown as Page;
    const browser = {
        connected: true,
        newPage: async () => page,
        on() { return this; },
        close: async () => {},
    } as unknown as Browser;
    const generator = new PuppeteerResumePdfGenerator(new RenderSnapshotStore(), async () => browser, 1, 100);

    const jpg = await generator.generateJpg(snapshot);
    assert.equal(jpg.toString(), 'JPG-success');
    assert.equal(queriedSelector, '[data-resume-render-ready="true"] [data-resume-template]');
    assert.deepEqual(screenshotOptions, {
        type: 'jpeg',
        quality: 92,
        captureBeyondViewport: true,
    });
    assert.deepEqual(renderEvents, ['goto', 'ready', 'assets', 'screenshot']);
    assert.equal(pageClosed, true);
    await generator.dispose();
});
