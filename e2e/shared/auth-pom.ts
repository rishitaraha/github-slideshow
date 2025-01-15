import { Page, Browser } from '@playwright/test';
import { adminStorageStatePath, memberStorageStatePath } from '../global-setup';
export { expect } from '@playwright/test';

// Page Object Model for the "admin" page.
// Here you can add locators and helper methods specific to the admin page.
export class AdminPage {
  // Page signed in as "admin".
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  static async create(browser: Browser) {
    const context = await browser.newContext({
      storageState: adminStorageStatePath,
    });
    const page = await context.newPage();
    return new AdminPage(page);
  }
}

// Page Object Model for the "member" page.
// Here you can add locators and helper methods specific to the member page.
export class MemberPage {
  // Page signed in as "member".
  page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  static async create(browser: Browser) {
    const context = await browser.newContext({
      storageState: memberStorageStatePath,
    });
    const page = await context.newPage();
    return new MemberPage(page);
  }
}
