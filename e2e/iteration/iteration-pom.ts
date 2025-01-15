import { Page, expect, Locator } from '@playwright/test';

export class IterationPOM {
  readonly page: Page;
  readonly iterationProject: Locator;
  readonly sitesList: Locator;
  readonly firstSite: Locator;
  readonly secondSite: Locator;
  readonly thirdSite: Locator;
  readonly firstSiteIterationsBtn: Locator;
  readonly secondSiteIterationsBtn: Locator;
  readonly thirdSiteIterationsBtn: Locator;
  readonly iterationList: Locator;
  readonly firstIteration: Locator;
  readonly addIterationBtn: Locator;
  readonly iterationNameInput: Locator;
  readonly iterationDateInput: Locator;
  readonly sidecardAddIterationBtn: Locator;
  readonly addIterationSidecard: Locator;
  readonly editIterationSidecard: Locator;
  readonly firstIterationEditBtn: Locator;
  readonly updateIterationBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.iterationProject = this.page
      .getByTestId('projects-list')
      .locator('> div:nth-child(2)');
    this.sitesList = this.page.locator('tbody');
    this.firstSite = this.sitesList.locator('> tr:first-child');
    this.firstSiteIterationsBtn = this.firstSite.getByTestId(
      'test-site-list-iteration-button'
    );
    this.secondSite = this.sitesList.locator('> tr:nth-child(2)');
    this.secondSiteIterationsBtn = this.secondSite.getByTestId(
      'test-site-list-iteration-button'
    );
    this.thirdSite = this.sitesList.locator('> tr:nth-child(3)');
    this.thirdSiteIterationsBtn = this.thirdSite.getByTestId(
      'test-site-list-iteration-button'
    );
    this.iterationList = this.page.locator('tbody');
    this.firstIteration = this.iterationList.locator('> tr:first-child');
    this.addIterationBtn = this.page.getByTestId('add-iteration-btn');
    this.iterationNameInput = this.page.locator("input[name='name']");
    this.iterationDateInput = this.page.locator("input[name='date']");
    this.sidecardAddIterationBtn = this.page.getByTestId(
      'sidecard-add-iteration-btn'
    );
    this.addIterationSidecard = this.page.getByTestId('add-iteration-sidecard');
    this.editIterationSidecard = this.page.getByTestId(
      'edit-iteration-sidecard'
    );
    this.firstIterationEditBtn =
      this.firstIteration.getByTestId('edit-iteration-btn');
    this.updateIterationBtn = this.page.getByTestId(
      'sidecard-update-iteration-btn'
    );
  }

  async goToIteration() {
    const { page, iterationProject, sitesList } = this;

    await page.goto('/projects');
    await iterationProject.click();
    await expect(sitesList).toBeVisible();
  }

  async testPaginatedListForPageCount(pageCount: number): Promise<void> {
    // Arrange.
    const { page, iterationList } = this;
    const paginationCountInput = page.locator('.aus-select__input');

    // Act.
    await paginationCountInput.fill(pageCount.toString());
    await page.keyboard.press('Enter');
    await paginationCountInput.click();

    // Assert.
    await expect(iterationList).toBeVisible();
    await expect(iterationList.locator('[data-row-id]')).toHaveCount(pageCount);
  }
}
