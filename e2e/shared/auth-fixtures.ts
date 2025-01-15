import { test as base } from '@playwright/test';
import { AdminPage, MemberPage } from './auth-pom';

// Declare the types of your fixtures.
type AuthFixtures = {
  adminPage: AdminPage;
  memberPage: MemberPage;
};

// Extend base test by providing "adminPage" and "memberPage".
// This new "test" can be used in multiple test files, and each of them will get the fixtures.
export const test = base.extend<AuthFixtures>({
  adminPage: async ({ browser }, use) => {
    await use(await AdminPage.create(browser));
  },
  memberPage: async ({ browser }, use) => {
    await use(await MemberPage.create(browser));
  },
});
