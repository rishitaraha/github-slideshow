// import { expect, test } from '@playwright/test';
// import {
//   adminStorageStatePath,
//   memberStorageStatePath,
// } from '../../global-setup';

// // Admin test for navigation.
// test.use({ storageState: adminStorageStatePath });
// test('admin test for sidenav', async ({ page }) => {
//   await page.goto('/projects');
//   await page.locator('text=Rainbowtest >> svg').first().click();
//   const sideNavLocator = await page.locator(
//     '.offcanvas-body .accordion-sidenav-item'
//   );
//   await expect(sideNavLocator).toContainText([
//     'Dashboard',
//     'Projects',
//     '2D Map',
//     '3D Map',
//     'Swipe Map',
//     'Access Tags',
//     'Users',
//     'User Groups',
//   ]);
// });

// // Members test for navigation.
// test.describe(() => {
//   test.use({ storageState: memberStorageStatePath });

//   test('member test for sidenav', async ({ page }) => {
//     await page.goto('/projects');
//     await page.locator('text=Rainbowtest >> svg').first().click();
//     const sideNavLocator = await page.locator(
//       '.offcanvas-body .accordion-sidenav-item'
//     );
//     await expect(sideNavLocator).toContainText([
//       'Dashboard',
//       'Projects',
//       '2D Map',
//       '3D Map',
//       'Swipe Map',
//     ]);
//   });
// });
