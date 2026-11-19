import puppeteer, { type Browser, type HTTPRequest, type Page } from 'puppeteer';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ResumeRenderSnapshot } from '@resumax/shared-types';
import type { ResumePdfGenerator } from './resume-pdf-generator';
import { renderSnapshotStore, type RenderSnapshotStore } from './render-snapshot.store';

type BrowserFactory = () => Promise<Browser>;
type RenderOperation<T> = (page: Page) => Promise<T>;
type BrowserExecutablePathOptions = {
    configuredPath?: string;
    resolveManagedPath?: () => Promise<string>;
    platform?: NodeJS.Platform;
    environment?: { LOCALAPPDATA?: string };
    pathExists?: (path: string) => boolean;
};

const RENDER_READY_SELECTOR = '[data-resume-render-ready="true"] [data-resume-template]';
const RENDER_VIEWPORT = {
    width: 794,
    height: 1123,
    deviceScaleFactor: 2,
};

export async function resolveBrowserExecutablePath({
    configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH,
    resolveManagedPath = () => puppeteer.executablePath(),
    platform = process.platform,
    environment = process.env as { LOCALAPPDATA?: string },
    pathExists = existsSync,
}: BrowserExecutablePathOptions = {}) {
    const candidates: Array<string | undefined> = [configuredPath];

    try {
        candidates.push(await resolveManagedPath());
    } catch {
        // A bundled Puppeteer browser is optional in production.
    }

    if (platform === 'win32') {
        const localAppData = environment.LOCALAPPDATA;
        if (localAppData) {
            candidates.push(join(localAppData, 'Google', 'Chrome', 'Application', 'chrome.exe'));
        }
        candidates.push(
            'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
            'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
            'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        );
    } else if (platform === 'darwin') {
        candidates.push(
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
        );
    } else {
        candidates.push(
            '/usr/bin/google-chrome-stable',
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser',
            '/snap/bin/chromium',
        );
    }

    const executablePath = candidates.find((candidate): candidate is string =>
        Boolean(candidate && pathExists(candidate)),
    );
    if (!executablePath) {
        throw new Error(
            'Chrome or Chromium is required for resume exports. Set PUPPETEER_EXECUTABLE_PATH to its executable.',
        );
    }
    return executablePath;
}

class ConcurrencyGate {
    private active = 0;
    private readonly waiting: Array<() => void> = [];

    constructor(private readonly limit: number) {}

    async run<T>(operation: () => Promise<T>) {
        if (this.active >= this.limit) {
            await new Promise<void>((resolve) => this.waiting.push(resolve));
        }
        this.active += 1;
        try {
            return await operation();
        } finally {
            this.active -= 1;
            this.waiting.shift()?.();
        }
    }
}

export class PuppeteerResumePdfGenerator implements ResumePdfGenerator {
    private browser: Browser | null = null;
    private browserPromise: Promise<Browser> | null = null;
    private readonly gate: ConcurrencyGate;

    constructor(
        private readonly snapshotStore: RenderSnapshotStore = renderSnapshotStore,
        private readonly browserFactory: BrowserFactory = async () => {
            const executablePath = await resolveBrowserExecutablePath();
            return puppeteer.launch({
                headless: true,
                executablePath,
                args: ['--disable-dev-shm-usage', '--no-sandbox'],
            });
        },
        concurrency = Number(process.env.PDF_CONCURRENCY ?? 2),
        private readonly timeoutMilliseconds = Number(process.env.PDF_TIMEOUT_MS ?? 30_000),
    ) {
        this.gate = new ConcurrencyGate(Math.max(1, concurrency));
    }

    generate(snapshot: ResumeRenderSnapshot): Promise<Buffer> {
        return this.gate.run(() => this.withRenderPage(snapshot, async (page) => {
            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });
            return Buffer.from(pdf);
        }));
    }

    generateJpg(snapshot: ResumeRenderSnapshot): Promise<Buffer> {
        return this.gate.run(() => this.withRenderPage(snapshot, async (page) => {
            const resumeElement = await page.$(RENDER_READY_SELECTOR);
            if (!resumeElement) throw new Error('Resume template did not render');

            const jpg = await resumeElement.screenshot({
                type: 'jpeg',
                quality: 92,
                captureBeyondViewport: true,
            });
            return Buffer.from(jpg);
        }));
    }

    async dispose() {
        const browser = this.browser;
        this.browser = null;
        this.browserPromise = null;
        if (browser?.connected) await browser.close();
    }

    private async withRenderPage<T>(snapshot: ResumeRenderSnapshot, operation: RenderOperation<T>): Promise<T> {
        const token = this.snapshotStore.create(snapshot);
        let page: Page | null = null;

        try {
            const browser = await this.getBrowser();
            page = await browser.newPage();
            page.setDefaultNavigationTimeout(this.timeoutMilliseconds);
            page.setDefaultTimeout(this.timeoutMilliseconds);
            await page.setViewport(RENDER_VIEWPORT);
            await page.emulateMediaType('print');
            await this.restrictRequests(page);

            const frontendUrl = new URL(process.env.FRONTEND_URL ?? 'http://localhost:3000');
            const renderUrl = new URL('/en/resume/render', frontendUrl);
            renderUrl.searchParams.set('token', token);

            await page.goto(renderUrl.href, { waitUntil: 'networkidle0' });
            await page.waitForSelector(RENDER_READY_SELECTOR, { visible: true });
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined)));
                await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
            });
            return await operation(page);
        } catch (error) {
            if (this.browser && !this.browser.connected) {
                this.browser = null;
                this.browserPromise = null;
            }
            throw error;
        } finally {
            this.snapshotStore.delete(token);
            if (page) await page.close().catch(() => undefined);
        }
    }

    private async getBrowser() {
        if (this.browser?.connected) return this.browser;
        if (!this.browserPromise) {
            this.browserPromise = this.browserFactory()
                .then((browser) => {
                    this.browser = browser;
                    browser.on('disconnected', () => {
                        if (this.browser === browser) this.browser = null;
                        this.browserPromise = null;
                    });
                    return browser;
                })
                .catch((error) => {
                    this.browserPromise = null;
                    throw error;
                });
        }
        return this.browserPromise;
    }

    private async restrictRequests(page: Page) {
        const allowedOrigins = new Set([
            new URL(process.env.FRONTEND_URL ?? 'http://localhost:3000').origin,
            new URL(process.env.BACKEND_PUBLIC_URL ?? 'http://localhost:3001').origin,
        ]);
        await page.setRequestInterception(true);
        page.on('request', (request: HTTPRequest) => {
            try {
                const url = new URL(request.url());
                const allowedScheme = ['http:', 'https:', 'data:', 'blob:', 'about:'].includes(url.protocol);
                const allowedOrigin = ['data:', 'blob:', 'about:'].includes(url.protocol) || allowedOrigins.has(url.origin);
                if (allowedScheme && allowedOrigin) void request.continue();
                else void request.abort('blockedbyclient');
            } catch {
                void request.abort('blockedbyclient');
            }
        });
    }
}
