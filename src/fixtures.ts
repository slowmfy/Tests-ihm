import { test as base } from '@playwright/test';
import type { SauceDemo } from './dsl/SauceDemo';
import { PlaywrightSauceDemo } from './dsl/PlaywrightSauceDemo';

/**
 * Les tests ne reçoivent que `moi`, de type SauceDemo (l'interface du DSL) :
 * ils n'ont pas accès à la page Playwright, donc pas aux détails d'IHM.
 */
export const test = base.extend<{ moi: SauceDemo }>({
  moi: async ({ page }, use) => {
    await use(new PlaywrightSauceDemo(page));
  },
});

export { expect } from '@playwright/test';
export * from './dsl/domaine';
