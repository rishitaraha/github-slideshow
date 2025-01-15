import { test } from './site-fixture';
import { expect } from '@playwright/test';

test('should display sites', async ({ adminSitePOM: sitePOM }) => {
  const { sitesList, firstSite } = sitePOM;
  await expect(sitesList).toBeVisible();
  await expect(firstSite).toBeVisible();
});
