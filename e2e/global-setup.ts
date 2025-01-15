import { chromium, FullConfig } from '@playwright/test';
import { login } from './auth';
import path from 'path';

export const adminStorageStatePath = path.resolve(
  './storage-states/',
  'admin-state.json'
);
export const memberStorageStatePath = path.resolve(
  './storage-states/',
  'member-state.json'
);

// setup ref: https://playwright.dev/docs/auth#multiple-signed-in-roles
async function globalSetup(config: FullConfig) {
  require('dotenv').config({
    path: path.resolve(__dirname, '.env'),
    override: true,
  });

  const adminUser = process.env.TEST_ADMIN_USER || '';
  const adminPassword = process.env.TEST_ADMIN_PASSWORD || '';
  const memberUser = process.env.TEST_MEMBER_USER || '';
  const memberPassword = process.env.TEST_MEMBER_PASSWORD || '';

  const { baseURL } = config.projects[0].use;

  const browser = await chromium.launch({ headless: true });
  const adminPage = await browser.newPage({ baseURL });

  await adminPage.goto('/login');
  await login(adminPage, adminUser, adminPassword);

  await adminPage.waitForURL(`/3d-map`);
  await adminPage.context().storageState({ path: adminStorageStatePath });

  const memberPage = await browser.newPage({ baseURL });

  await memberPage.goto('/login');
  await login(memberPage, memberUser, memberPassword);

  await memberPage.waitForURL(`/3d-map`);
  await memberPage.context().storageState({ path: memberStorageStatePath });

  await browser.close();
}

export default globalSetup;
