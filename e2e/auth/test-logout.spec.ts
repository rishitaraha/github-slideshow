import { expect } from '@playwright/test';
import { test } from './../shared/auth-fixtures';

test('should navigate to login page when user click logout button', async ({ adminPage: pagePOM }) => {
  const page = pagePOM.page;

  await page.goto('/3d-map');
  const testUserBtn = page.getByTestId('test-dropdown-id');
  await testUserBtn.click();
  const logoutBtn = page.getByRole('button', { name: 'Log Out' });
  await logoutBtn.click();

  await page.waitForURL('/logout');
  await expect(page).toHaveURL('/login');
});
