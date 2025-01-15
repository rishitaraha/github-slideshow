import { test } from './iteration-fixture';
import { expect } from '@playwright/test';

test.describe('Edit Iteration', () => {
  test.beforeEach(
    'iteration should be visible',
    async ({ adminIterationPOM: iterationPOM }) => {
      const { iterationList } = iterationPOM;
      await expect(iterationList).toBeVisible();
    }
  );

  test('should be able to edit iteration', async ({
    adminIterationPOM: iterationPOM,
  }) => {
    // Arrange.
    const {
      page,
      firstIterationEditBtn,
      iterationNameInput,
      iterationDateInput,
      updateIterationBtn,
      editIterationSidecard,
      thirdSiteIterationsBtn,
    } = iterationPOM;
    const toastifyText = page.textContent('.Toastify__toast-body');

    // Act.
    await thirdSiteIterationsBtn.click();
    await firstIterationEditBtn.click();
    await expect(updateIterationBtn).toBeDisabled();
    await iterationNameInput.clear();
    await iterationNameInput.fill('test-iteration');
    await iterationDateInput.fill('2022-09-02');
    await expect(updateIterationBtn).toBeEnabled();
    await updateIterationBtn.click();

    // Assert.
    expect(await toastifyText).toContain('Iteration updated successfully');
    await expect(editIterationSidecard).not.toBeVisible();
  });
});
