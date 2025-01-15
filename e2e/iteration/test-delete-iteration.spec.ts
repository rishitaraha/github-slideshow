import { expect } from '@playwright/test';
import { test } from './iteration-fixture';

test.describe('Delete Iteration', () => {
  test.beforeEach(
    'iteration should be visible',
    async ({ adminIterationPOM: IterationPOM }) => {
      const { iterationList, firstIteration } = IterationPOM;
      await expect(iterationList).toBeVisible();
      await expect(firstIteration).toBeVisible();
    }
  );

  test('should be able to delete iteration', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page, firstIteration, secondSiteIterationsBtn } = IterationPOM;
    const deleteIterationBtn = firstIteration.getByTestId(
      'remove-iteration-btn'
    );
    const modalConfirmDeleteBtn = page.getByTestId(
      'confirm-delete-iteration-modal'
    );

    // Act.
    await secondSiteIterationsBtn.click();
    await deleteIterationBtn.click();
    await modalConfirmDeleteBtn.click();

    // Assert.
    expect(
      await page.textContent('.Toastify__toast--success .Toastify__toast-body')
    ).toContain('Iteration deleted successfully!');
  });
});
