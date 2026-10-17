import { blazor } from './blazor.js';
import type { Frontend, FrontendName } from './frontend.js';
import { vue } from './vue.js';

export type { Frontend, FrontendName } from './frontend.js';

/** The implementation of each frontend, keyed by the `frontend` option of a project. */
export const frontends: Record<FrontendName, Frontend> = { blazor, vue };
