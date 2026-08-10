import test from 'node:test';
import assert from 'node:assert/strict';
import type { Browser, Page } from 'puppeteer';
import { DEFAULT_RESUME_CUSTOMIZATION, type ResumeRenderSnapshot } from '@resumax/shared-types';
import { PuppeteerResumePdfGenerator } from './puppeteer-resume-pdf.generator';
import { RenderSnapshotStore } from './render-snapshot.store';

const snapshot: ResumeRenderSnapshot = {
    resumeId: 'resume-1', title: 'Test Resume', templateId: 'minimal', templateVersion: 1,
    createdAt: new Date().toISOString(), customization: DEFAULT_RESUME_CUSTOMIZATION,
    content: {
        contact: { fullName: 'Test User', title: '', email: '', phone: '', location: '', linkedin: '' },
        experience: [], education: [], certifications: [], skills: [],
    },
};

test('closes a Puppeteer page when rendering fails', async () => {
    let pageClosed = false;
    const page = {
        setDefaultNavigationTimeout() {},
        setDefaultTimeout() {},
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
    const page = {
        setDefaultNavigationTimeout() {},
        setDefaultTimeout() {},
        setRequestInterception: async () => {},
        on() { return this; },
        goto: async () => null,
        waitForSelector: async () => null,
        evaluate: async () => undefined,
        pdf: async () => new Uint8Array(Buffer.from('%PDF-success')),
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
    assert.equal(pageClosed, true);
    await generator.dispose();
});
