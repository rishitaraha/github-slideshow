import { expect, Locator, Page } from '@playwright/test';

// Ref: https://playwright.dev/docs/pom
export class ProjectPOM {
  readonly page: Page;
  readonly addProjectBtnInitial: Locator;
  readonly addProjectBtn: Locator;
  readonly updateProjectBtn: Locator;
  readonly updateProjectCard: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addProjectBtnInitial = this.page.getByTestId(
      'add-project-btn-initial'
    );
    this.addProjectBtn = this.page.getByTestId('add-project-btn-submit');
    this.updateProjectBtn = this.page.getByTestId(`update-project-1-btn`);
    this.updateProjectCard = this.page.getByTestId(`update-project-1-card`);
  }

  async goTo() {
    await this.page.goto('/projects');
  }

  searchProject = async (page: Page, searchString: string) => {
    const searchBox = page.locator("input[name='searchInput']");
    const button = page.locator('.aus-icon-btn.btn.btn-primary');

    await page.waitForURL('**/projects');
    await searchBox.click();
    await searchBox.fill(searchString);
    await button.click();
  };
}
