import path from 'path';
import { expect } from 'playwright/test';
import { test } from './site-fixture';

test.describe('Upload and remove the Legend and Base Site DSM files', () => {
  test.beforeEach(
    'sites should be visible',
    async ({ adminSitePOM: sitePOM }) => {
      const { editFirstSiteBtn, sitesList } = sitePOM;
      await expect(sitesList).toBeVisible();
      await editFirstSiteBtn.click();
    }
  );

  test('should be able to upload and remove DSM file', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { page, editFirstSiteBtn } = sitePOM;
    const dsmFileInputField = page.locator(
      'input[type="file"][name="baseDSM"]'
    );
    const cancelBtn = page.getByTestId('edit-site-sidecard-cancel-btn');
    const dsmFileRemoveIcon = page.getByTestId('remove-dsm-site-btn');

    // Act.
    // Uploading DSM file.
    await dsmFileInputField.click();
    await dsmFileInputField.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await page.getByTestId('test-update-site-button').click();
    await page.waitForTimeout(10000);

    // FIXME: File card has to be shown after upload is successful.
    await page.getByTestId('edit-site-done-btn').click();
    await editFirstSiteBtn.click();

    // Removing DSM file.
    await expect(dsmFileRemoveIcon).toBeVisible();
    await dsmFileRemoveIcon.click();
    await page.getByTestId('confirm-delete-dsm-site-btn').click();
    await cancelBtn.click();
    await editFirstSiteBtn.click();

    // Assert.
    await expect(dsmFileRemoveIcon).not.toBeVisible();
  });

  test('should be able to upload and remove legend file', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { page, editFirstSiteBtn } = sitePOM;
    const legendImgInputField = page.locator(
      'input[type="file"][name="legendImage"]'
    );
    const cancelBtn = page.getByTestId('edit-site-sidecard-cancel-btn');
    const legendFileRemoveIcon = page.getByTestId('remove-legend-site-btn');

    // Act.
    // Uploading legend file.
    await legendImgInputField.click();
    await legendImgInputField.setInputFiles(
      path.join(__dirname, '../assets/legend.png')
    );
    await page.getByTestId('test-update-site-button').click();
    await page.waitForTimeout(10000);

    // FIXME: File card has to be shown after upload is successful.
    await page.getByTestId('edit-site-done-btn').click();
    await editFirstSiteBtn.click();

    // Removing legend file.
    await expect(legendFileRemoveIcon).toBeVisible();
    await legendFileRemoveIcon.click();
    await page.getByTestId('confirm-delete-legend-site-btn').click();
    await cancelBtn.click();
    await editFirstSiteBtn.click();

    // Assert.
    await expect(legendFileRemoveIcon).not.toBeVisible();
  });
});
