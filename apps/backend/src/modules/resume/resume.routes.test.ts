import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuthenticated } from '../../common/middlewares/auth.middleware';
import { checkPlan } from '../../common/middlewares/plan.middleware';
import { resumeRouter } from './resume.routes';

type RouteLayer = {
    handle?: unknown;
    route?: {
        path: string;
        methods: Record<string, boolean>;
        stack: Array<{ handle: unknown }>;
    };
};

test('registers the authenticated and plan-gated JPG export route', () => {
    const layers = (resumeRouter as unknown as { stack: RouteLayer[] }).stack;
    const authIndex = layers.findIndex((layer) => layer.handle === isAuthenticated);
    const jpgRouteIndex = layers.findIndex((layer) => layer.route?.path === '/:rid/exports/jpg');
    const jpgRoute = layers[jpgRouteIndex];

    assert.ok(jpgRoute?.route);
    assert.ok(authIndex >= 0 && authIndex < jpgRouteIndex);
    assert.equal(jpgRoute.route.methods.post, true);
    assert.ok(jpgRoute.route.stack.some((layer) => layer.handle === checkPlan));
});
