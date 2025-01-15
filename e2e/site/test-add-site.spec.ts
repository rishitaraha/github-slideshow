import { Locator, Page, expect } from 'playwright/test';
import { test } from './site-fixture';

test.describe('Add Site ', () => {
  test.beforeEach(
    'sites should be visible',
    async ({ adminSitePOM: sitePOM }) => {
      const { sitesList } = sitePOM;
      await expect(sitesList).toBeVisible();
    }
  );

  test('should be able to add a Site', async ({ adminSitePOM: sitePOM }) => {
    // Arrange.
    const {
      page,
      addSiteBtn,
      addSiteBtnInitial,
      addSiteSubmitBtn,
      sitesList,
      fillSiteDetails,
    } = sitePOM;
    const addBtnId =
      (await sitesList.count()) === 0 ? addSiteBtnInitial : addSiteBtn;

    // Act.
    await fillSiteDetails(
      page,
      'Test-Site',
      addBtnId,
      addSiteSubmitBtn,
      '1',
      '1'
    );
    await expect(addSiteSubmitBtn).toBeEnabled();
    await addSiteSubmitBtn.click();
    await page.getByTestId('add-site-done-btn').click();

    // Assert.
    // side card component expected to be closed after site added.
    await expect(page.getByTestId('add-site-side-card')).not.toBeVisible();
  });

  test('should show "field required" error upon clicking "Add Site" button without providing valid site details', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { page, addSiteBtn, addSiteSubmitBtn, fillSiteDetails } = sitePOM;

    // Act.
    await fillSiteDetails(page, '', addSiteBtn, addSiteSubmitBtn, '', '');
    await page.locator("input[name='siteBoundary']").click();

    // Assert.
    await expect(addSiteSubmitBtn).toBeDisabled();
    await expect(page.locator('.aus-input__error').first()).toBeVisible();
    await expect(page.locator('.aus-input__error').nth(1)).toBeVisible();
    await expect(page.locator('.aus-input__error').nth(2)).toBeVisible();
  });

  test('should provide access to "Access control" tab when valid site details provided and "Add site" button get clicked', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { page, addSiteBtn, addSiteSubmitBtn, fillSiteDetails } = sitePOM;
    const accessControlTab = page.getByRole('tab', { name: 'Access Control' });

    // Act.
    await fillSiteDetails(
      page,
      'Test-Site',
      addSiteBtn,
      addSiteSubmitBtn,
      '1',
      '1'
    );
    await addSiteSubmitBtn.click();
    await accessControlTab.click();

    // Assert.
    await expect(page.getByTestId('add-site-done-btn')).toBeVisible();
  });

  test('should display "Validation Error" for invalid number inputs ', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { page, addSiteBtn, addSiteSubmitBtn, fillSiteDetails } = sitePOM;

    // Act.
    await fillSiteDetails(
      page,
      'Test-Site',
      addSiteBtn,
      addSiteSubmitBtn,
      '1W',
      '1fd'
    );
    await page.locator("input[name='siteBoundary']").click();

    // Assert.
    await expect(addSiteSubmitBtn).toBeDisabled();
    await expect(page.locator('.aus-input__error').first()).toBeVisible();
    await expect(page.locator('.aus-input__error').nth(1)).toBeVisible();
  });
});
