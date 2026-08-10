import puppeteer, { type Browser, type HTTPRequest, type Page } from 'puppeteer';
import { existsSync } from 'node:fs';
import type { ResumeRenderSnapshot } from '@resumax/shared-types';
import type { ResumePdfGenerator } from './resume-pdf-generator';
import { renderSnapshotStore, type RenderSnapshotStore } from './render-snapshot.store';

type BrowserFactory = () => Promise<Browser>;

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
            const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;
            const managedPath = configuredPath ?? await puppeteer.executablePath();
            const systemPath = existsSync(managedPath) ? managedPath : await puppeteer.executablePath('chrome');
            return puppeteer.launch({
                headless: true,
                executablePath: systemPath,
                args: ['--disable-dev-shm-usage', '--no-sandbox'],
            });
        },
        concurrency = Number(process.env.PDF_CONCURRENCY ?? 2),
        private readonly timeoutMilliseconds = Number(process.env.PDF_TIMEOUT_MS ?? 30_000),
    ) {
        this.gate = new ConcurrencyGate(Math.max(1, concurrency));
    }

    generate(snapshot: ResumeRenderSnapshot): Promise<Buffer> {
        return this.gate.run(() => this.generateWithPage(snapshot));
    }

    async dispose() {
        const browser = this.browser;
        this.browser = null;
        this.browserPromise = null;
        if (browser?.connected) await browser.close();
    }

    private async generateWithPage(snapshot: ResumeRenderSnapshot) {
        const token = this.snapshotStore.create(snapshot);
        let page: Page | null = null;

        try {
            const browser = await this.getBrowser();
            page = await browser.newPage();
            page.setDefaultNavigationTimeout(this.timeoutMilliseconds);
            page.setDefaultTimeout(this.timeoutMilliseconds);
            await this.restrictRequests(page);

            const frontendUrl = new URL(process.env.FRONTEND_URL ?? 'http://localhost:3000');
            const renderUrl = new URL('/en/resume/render', frontendUrl);
            renderUrl.searchParams.set('token', token);

            await page.goto(renderUrl.href, { waitUntil: 'networkidle0' });
            await page.waitForSelector('[data-resume-render-ready="true"]');
            await page.evaluate(async () => {
                await document.fonts.ready;
                await Promise.all(Array.from(document.images).map((image) => {
                    if (image.complete) return Promise.resolve();
                    return new Promise<void>((resolve) => {
                        image.addEventListener('load', () => resolve(), { once: true });
                        image.addEventListener('error', () => resolve(), { once: true });
                    });
                }));
            });

            const pdf = await page.pdf({
                format: 'A4',
                printBackground: true,
                preferCSSPageSize: true,
                margin: { top: '0', right: '0', bottom: '0', left: '0' },
            });
            return Buffer.from(pdf);
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
