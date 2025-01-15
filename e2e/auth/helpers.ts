import { Page } from '@playwright/test';

export async function login(page: Page, user: string, password: string) {
  await page.locator('input[name="email"]').click();
  await page.locator('input[name="email"]').fill(user);
  await page.locator('input[name="password"]').click();
  await page.locator('input[name="password"]').fill(password);
  await page.getByTestId('login-btn').click();
}
