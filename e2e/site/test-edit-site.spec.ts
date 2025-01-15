import { expect } from 'playwright/test';
import { test } from './site-fixture';

test.describe('Edit Site ', () => {
  test.beforeEach(
    'sites should be visible',
    async ({ adminSitePOM: sitePOM }) => {
      const { sitesList } = sitePOM;
      await expect(sitesList).toBeVisible();
    }
  );

  test('should be able to edit a Site details', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      page,
      editFirstSiteBtn,
      updateSiteSubmitBtn,
      fillSiteDetails,
      accessControlTab,
    } = sitePOM;

    // Act.
    await fillSiteDetails(
      page,
      'Test-Site',
      editFirstSiteBtn,
      updateSiteSubmitBtn,
      '20',
      '10'
    );
    await expect(updateSiteSubmitBtn).toBeEnabled();
    await updateSiteSubmitBtn.click();
    await accessControlTab.click();
    await page.getByTestId('edit-site-done-btn').click();

    // Assert.
    // Side card component expected to be closed after site added.
    await expect(page.getByTestId('edit-site-side-card')).not.toBeVisible();
  });

  test('should be able to search for user groups in Access Control', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      editFirstSiteBtn,
      accessControlTab,
      searchInputField,
      accordionList,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await searchInputField.click();
    await searchInputField.fill('Aus');

    // Assert.
    await expect(accordionList).toHaveCount(1);
  });

  test('should display "No Results Found" text in side card when user group is not present', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const {
      editFirstSiteBtn,
      accessControlTab,
      searchInputField,
      accordionList,
    } = sitePOM;

    // Act.
    await editFirstSiteBtn.click();
    await accessControlTab.click();
    await searchInputField.click();
    await searchInputField.fill('mtl');

    // Assert.
    await expect(accordionList).not.toBeVisible();
  });
});
