import { expect } from '@playwright/test';
import path from 'path';
import { test } from './iteration-fixture';

test.describe('Upload and remove DSM file', () => {
  test.beforeEach(
    'iteration should be visible',
    async ({ adminIterationPOM: IterationPOM }) => {
      const { iterationList } = IterationPOM;
      await expect(iterationList).toBeVisible();
    }
  );

  test('should be able to upload DSM file', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const {
      page,
      firstIterationEditBtn,
      updateIterationBtn,
      thirdSiteIterationsBtn,
    } = IterationPOM;
    const dsmFileInputField = page.locator(
      'input[type="file"][name="capturedDSM"]'
    );
    const removeDSMfileBtn = page.getByTestId('remove-dsm-iteration-btn');

    // Act.
    await thirdSiteIterationsBtn.click();
    await firstIterationEditBtn.click();
    await dsmFileInputField.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await updateIterationBtn.click();
    await page.waitForTimeout(7000);

    // FIXME: File card has to be shown after upload is successful.
    await updateIterationBtn.click();
    await firstIterationEditBtn.click();

    // Assert.
    await expect(removeDSMfileBtn).toBeVisible();
  });

  test('should be able to delete DSM file', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page, iterationList, updateIterationBtn, thirdSiteIterationsBtn } =
      IterationPOM;
    const secondIterationEditBtn = iterationList
      .locator('> tr:nth-child(2)')
      .getByTestId('edit-iteration-btn');
    const dsmFileInputField = page.locator(
      'input[type="file"][name="capturedDSM"]'
    );
    const sidecardCancelBtn = page.getByTestId('sidecard-cancel-btn');
    const removeDSMfileBtn = page.getByTestId('remove-dsm-iteration-btn');
    const confirmDeleteDSMfileBtn = page.getByTestId(
      'confirm-delete-dsm-iteration-btn'
    );

    // Act.
    await thirdSiteIterationsBtn.click();
    await secondIterationEditBtn.click();
    await dsmFileInputField.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await updateIterationBtn.click();
    await page.waitForTimeout(7000);

    // FIXME: File card has to be shown after upload is successful.
    await updateIterationBtn.click();
    await secondIterationEditBtn.click();
    await removeDSMfileBtn.click();
    await confirmDeleteDSMfileBtn.click();
    await sidecardCancelBtn.click();
    await secondIterationEditBtn.click();

    // Assert.
    await expect(removeDSMfileBtn).not.toBeVisible();
  });

  test('should be able to cancel uploading DSM file', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page, iterationList, updateIterationBtn, thirdSiteIterationsBtn } =
      IterationPOM;
    const thirdIterationEditBtn = iterationList
      .locator('> tr:nth-child(3)')
      .getByTestId('edit-iteration-btn');
    const dsmFileInputField = page.locator(
      'input[type="file"][name="capturedDSM"]'
    );
    const sidecardCancelBtn = page.getByTestId('sidecard-cancel-btn');

    // Act.
    await thirdSiteIterationsBtn.click();
    await thirdIterationEditBtn.click();
    await dsmFileInputField.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await updateIterationBtn.click();
    await sidecardCancelBtn.click();

    // Assert.
    expect(
      await page.textContent('.Toastify__toast--error .Toastify__toast-body')
    ).toContain('File upload failed. Try again');
  });
});
