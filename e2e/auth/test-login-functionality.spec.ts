import { test, expect } from '@playwright/test';
import { login } from './helpers';

test.describe('Login', () => {
  test.beforeEach('Go to Login Page', async ({ page }) => {
    await page.goto('/login');
  });

  test('should be able to navigate to 3d map on successful login', async ({
    page,
  }) => {
    const memberUser = process.env.TEST_MEMBER_USER || '';
    const memberPassword = process.env.TEST_MEMBER_PASSWORD || '';
    await login(page, memberUser, memberPassword);
    await expect(page).toHaveURL(/3d-map/);
  });

  test('should see "Invalid email" error for invalid email id', async ({
    page,
  }) => {
    const user = 'usergmail.com';
    const password = '';
    await login(page, user, password);
    await expect(
      page.locator('text= Please enter a valid email')
    ).toBeVisible();
  });

  test('should see incorrect login credentials message', async ({ page }) => {
    const user = 'user123@aus.co.in';
    const password = '12345';
    await login(page, user, password);
    await expect(
      page.locator('text=Incorrect email or password')
    ).toBeVisible();
  });

  test('should see "field required" error for not providing credentials', async ({
    page,
  }) => {
    const user = '';
    const password = '';
    await login(page, user, password);
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=This field is required.')).toBeVisible();
  });
});
