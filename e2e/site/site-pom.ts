import { Page, Locator, expect } from '@playwright/test';

export class SitePOM {
  readonly page: Page;
  readonly sitesList: Locator;
  readonly firstSite: Locator;
  readonly addSiteBtnInitial: Locator;
  readonly addSiteBtn: Locator;
  readonly addSiteSubmitBtn: Locator;
  readonly editFirstSiteBtn: Locator;
  readonly updateSiteSubmitBtn: Locator;
  readonly accordionList: Locator;
  readonly viewSiteCheckbox: Locator;
  readonly createAndManageCheckbox: Locator;
  readonly accessControlTab: Locator;
  readonly firstUserGroup: Locator;
  readonly firstUserGroupCheckbox: Locator;
  readonly searchInputField: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sitesList = this.page.locator('tbody');
    this.firstSite = this.sitesList.locator('> tr:first-child');
    this.addSiteBtnInitial = this.page.getByTestId('test-add-site-btn-no-site');
    this.addSiteBtn = this.page.getByTestId('test-add-site-btn');
    this.addSiteSubmitBtn = this.page.getByTestId(
      'test-add-site-btn-side-card'
    );
    this.editFirstSiteBtn = this.firstSite.getByTestId('test-edit-site-button');
    this.updateSiteSubmitBtn = this.page.getByTestId('test-update-site-button');
    this.accordionList = this.page.getByTestId('accordion-list-id');
    this.viewSiteCheckbox = this.page.getByTestId('view-site-checkbox-id');
    this.createAndManageCheckbox = this.page.getByTestId(
      'create-manage-site-checkbox-id'
    );
    this.accessControlTab = this.page.getByRole('tab', {
      name: 'Access Control',
    });
    this.firstUserGroup = this.page
      .getByTestId('accordion-list-id')
      .locator('> div:first-child');
    this.firstUserGroupCheckbox = this.firstUserGroup.getByRole('checkbox');
    this.searchInputField = this.page.locator('#search-box-input-field');
  }

  async goTo() {
    await this.page.goto('/projects');
    const firstProject = this.page
      .getByTestId('projects-list')
      .locator('> div:first-child');
    await firstProject.click();
  }

  fillSiteDetails = async (
    page: Page,
    siteName: string,
    addOrEditSiteBtn: Locator,
    submitBtn: Locator,
    longitude: string,
    latitude: string
  ): Promise<void> => {
    await addOrEditSiteBtn.click();
    await expect(submitBtn).toBeDisabled();
    await page.locator("input[name='siteName']").click();
    await page.locator("input[name='siteName']").pressSequentially(siteName);
    await page.locator("input[name='longitude']").click();
    await page.locator("input[name='longitude']").pressSequentially(longitude);
    await page.locator("input[name='latitude']").click();
    await page.locator("input[name='latitude']").pressSequentially(latitude);
  };

  paginationTest = async (
    sitesList: Locator,
    pageCount: number
  ): Promise<void> => {
    // Arrange.
    const { page } = this;
    const paginationCountInput = page.locator('#react-select-3-input');

    // Act.
    await paginationCountInput.fill(pageCount.toString());
    await page.keyboard.press('Enter');
    await paginationCountInput.click();

    // Assert.
    await expect(sitesList).toBeVisible();
    await expect(sitesList.locator('div:first-child')).toHaveCount(pageCount);
  };
}
