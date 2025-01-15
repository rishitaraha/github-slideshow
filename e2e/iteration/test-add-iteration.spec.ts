import { expect } from '@playwright/test';
import path from 'path';
import { test } from './iteration-fixture';

test.describe('Add Iteration', () => {
  test.beforeEach(
    'iteration should be visible',
    async ({ adminIterationPOM: IterationPOM }) => {
      const { iterationList } = IterationPOM;
      await expect(iterationList).toBeVisible();
    }
  );

  test('should be display iterations in the third site', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { iterationList, secondSiteIterationsBtn } = IterationPOM;

    // Act.
    await secondSiteIterationsBtn.click();

    // Assert.
    await expect(iterationList).toBeVisible();
  });

  test('should be able to add iteration without DSM file', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const {
      page,
      addIterationBtn,
      iterationNameInput,
      iterationDateInput,
      sidecardAddIterationBtn,
      addIterationSidecard,
      secondSiteIterationsBtn,
    } = IterationPOM;
    const toastifyText = page.textContent('.Toastify__toast-body');

    // Act.
    await secondSiteIterationsBtn.click();
    await addIterationBtn.click();
    await iterationNameInput.fill('iteration-1');
    await iterationDateInput.fill('2024-05-09');
    await sidecardAddIterationBtn.click();

    // Assert.
    expect(await toastifyText).toContain('Iteration created successfully');
    await expect(addIterationSidecard).not.toBeVisible();
  });

  test('should be able to add iteration with DSM file', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const {
      page,
      addIterationBtn,
      iterationNameInput,
      iterationDateInput,
      sidecardAddIterationBtn,
      addIterationSidecard,
      secondSiteIterationsBtn,
    } = IterationPOM;
    const dsmFileInputField = page.locator(
      'input[type="file"][name="capturedDSM"]'
    );
    const toastifyText = page.textContent('.Toastify__toast-body');

    // Act.
    await secondSiteIterationsBtn.click();
    await addIterationBtn.click();
    await iterationNameInput.fill('iteration-1');
    await iterationDateInput.fill('2024-05-09');
    await dsmFileInputField.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await sidecardAddIterationBtn.click();
    await page.waitForTimeout(7000);
    await sidecardAddIterationBtn.click();

    // Assert.
    expect(await toastifyText).toContain('Iteration created successfully');
    await expect(addIterationSidecard).not.toBeVisible();
  });

  test('should display validation error when user not filled the mandatory fields', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const {
      addIterationBtn,
      iterationNameInput,
      iterationDateInput,
      sidecardAddIterationBtn,
      page,
      secondSiteIterationsBtn,
    } = IterationPOM;

    // Act.
    await secondSiteIterationsBtn.click();
    await addIterationBtn.click();
    await iterationDateInput.click();
    await iterationNameInput.click();
    await iterationNameInput.blur();

    // Assert.
    await expect(sidecardAddIterationBtn).toBeDisabled();
    await expect(page.locator('.aus-input__error').first()).toBeVisible();
    await expect(page.locator('.aus-input__error').nth(1)).toBeVisible();
  });
});
