import { randomBytes } from 'node:crypto';
import type { ResumeRenderSnapshot } from '@resumax/shared-types';

type StoredSnapshot = {
    expiresAt: number;
    snapshot: ResumeRenderSnapshot;
};

export class RenderSnapshotStore {
    private readonly snapshots = new Map<string, StoredSnapshot>();

    constructor(private readonly ttlMilliseconds = 60_000) {}

    create(snapshot: ResumeRenderSnapshot) {
        this.prune();
        const token = randomBytes(32).toString('base64url');
        this.snapshots.set(token, {
            expiresAt: Date.now() + this.ttlMilliseconds,
            snapshot: structuredClone(snapshot),
        });
        return token;
    }

    consume(token: string): ResumeRenderSnapshot | null {
        const stored = this.snapshots.get(token);
        this.snapshots.delete(token);
        if (!stored || stored.expiresAt <= Date.now()) return null;
        return structuredClone(stored.snapshot);
    }

    delete(token: string) {
        this.snapshots.delete(token);
    }

    private prune() {
        const now = Date.now();
        for (const [token, stored] of this.snapshots) {
            if (stored.expiresAt <= now) this.snapshots.delete(token);
        }
    }
}

export const renderSnapshotStore = new RenderSnapshotStore();
