'use client';

export type PaddleEnvironment = 'sandbox' | 'production';

export interface PaddleCheckoutOptions {
    priceId: string;
    userId: string;
    userEmail: string;
    planId: string;
    locale?: string;
    onSuccess?: (data: unknown) => void;
    onClose?: () => void;
}

export interface PaddleInstance {
    Environment?: {
        set: (env: PaddleEnvironment) => void;
    };
    Initialize: (options: {
        token: string;
        eventCallback?: (event: { name: string; data?: unknown }) => void;
    }) => void;
    Checkout: {
        open: (options: {
            items?: Array<{ priceId: string; quantity: number }>;
            customer?: { email?: string };
            customData?: Record<string, unknown>;
            settings?: {
                displayMode?: 'overlay' | 'inline';
                theme?: 'light' | 'dark';
                locale?: string;
                successUrl?: string;
            };
        }) => void;
        close: () => void;
    };
}

declare global {
    interface Window {
        Paddle?: PaddleInstance;
    }
}

let isInitialized = false;
let initPromise: Promise<PaddleInstance | null> | null = null;
let activeSuccessCallback: ((data: unknown) => void) | null = null;
let activeCloseCallback: (() => void) | null = null;

/**
 * Loads and initializes the Paddle.js SDK
 */
export async function getPaddleInstance(): Promise<PaddleInstance | null> {
    if (typeof window === 'undefined') return null;

    if (window.Paddle && isInitialized) {
        return window.Paddle;
    }

    if (initPromise) return initPromise;

    initPromise = new Promise((resolve) => {
        const clientToken = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || '';
        const environment = (process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as PaddleEnvironment) || 'sandbox';

        const setupPaddle = () => {
            if (window.Paddle) {
                try {
                    if (!isInitialized) {
                        if (window.Paddle.Environment && typeof window.Paddle.Environment.set === 'function') {
                            window.Paddle.Environment.set(environment);
                        }
                        if (clientToken) {
                            window.Paddle.Initialize({
                                token: clientToken,
                                eventCallback: (event) => {
                                    if (event && event.name) {
                                        console.log('[Paddle.js Event]', event.name, event.data);
                                        if (event.name === 'checkout.completed') {
                                            // Automatically close the overlay directly after 1.5 seconds so user sees confirmation then returns to the app
                                            setTimeout(() => {
                                                try {
                                                    window.Paddle?.Checkout?.close();
                                                } catch (e) {
                                                    console.warn('[Paddle.js] Auto-close failed:', e);
                                                }
                                            }, 1200);

                                            if (activeSuccessCallback) {
                                                activeSuccessCallback(event.data);
                                            }
                                        }
                                        if (event.name === 'checkout.closed' && activeCloseCallback) {
                                            activeCloseCallback();
                                        }
                                    }
                                },
                            });
                            isInitialized = true;
                        }
                    }
                    resolve(window.Paddle);
                } catch (err) {
                    console.error('[Paddle.js] Initialization error:', err);
                    resolve(window.Paddle);
                }
            } else {
                resolve(null);
            }
        };

        if (window.Paddle) {
            setupPaddle();
            return;
        }

        // Load Paddle CDN script
        const existingScript = document.querySelector('script[src*="paddle.js"]');
        if (existingScript) {
            existingScript.addEventListener('load', setupPaddle);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
        script.async = true;
        script.onload = setupPaddle;
        script.onerror = () => {
            console.error('[Paddle.js] Failed to load Paddle CDN script');
            resolve(null);
        };
        document.head.appendChild(script);
    });

    return initPromise;
}

/**
 * Opens Paddle Checkout Overlay
 */
export async function openPaddleCheckout(options: PaddleCheckoutOptions): Promise<boolean> {
    const paddle = await getPaddleInstance();
    if (!paddle) {
        console.warn('[Paddle.js] Paddle instance unavailable.');
        return false;
    }

    try {
        activeSuccessCallback = options.onSuccess || null;
        activeCloseCallback = options.onClose || null;

        const checkoutPayload: Record<string, unknown> = {
            items: [
                {
                    priceId: options.priceId,
                    quantity: 1,
                },
            ],
            settings: {
                displayMode: 'overlay',
                theme: 'dark',
                locale: options.locale || 'en',
            },
        };

        if (options.userEmail && options.userEmail.includes('@')) {
            checkoutPayload.customer = { email: options.userEmail };
        }

        if (options.userId || options.planId) {
            checkoutPayload.customData = {
                userId: options.userId,
                planId: options.planId,
                userEmail: options.userEmail,
            };
        }

        paddle.Checkout.open(checkoutPayload as Parameters<typeof paddle.Checkout.open>[0]);
        return true;
    } catch (err) {
        console.error('[Paddle.js] Checkout open error:', err);
        return false;
    }
}

/**
 * Closes the Paddle checkout overlay programmatically
 */
export function closePaddleCheckout(): void {
    if (typeof window !== 'undefined' && window.Paddle && window.Paddle.Checkout && typeof window.Paddle.Checkout.close === 'function') {
        window.Paddle.Checkout.close();
    }
}
