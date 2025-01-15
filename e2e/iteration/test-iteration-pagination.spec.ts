import { test } from './iteration-fixture';
import { expect } from '@playwright/test';

test.describe('Iteration pagination ', () => {
  test.beforeEach(
    'iteration should be visible',
    async ({ adminIterationPOM: IterationPOM }) => {
      const { iterationList, firstIterationEditBtn, secondSiteIterationsBtn } =
        IterationPOM;
      await secondSiteIterationsBtn.click();
      await expect(iterationList).toBeVisible();
      await expect(firstIterationEditBtn).toBeVisible();
    }
  );

  test('should be able to change the pagination count to 25', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Act.
    await IterationPOM.testPaginatedListForPageCount(25);
  });

  test('should be able to change the pagination count to 50', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Act.
    await IterationPOM.testPaginatedListForPageCount(50);
  });

  test('should be able to change the pagination count to 100', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Act.
    await IterationPOM.testPaginatedListForPageCount(100);
  });

  test('should have previous button disabled for the first page', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page } = IterationPOM;
    const paginationPreviousBtn = page.getByTestId(
      'table-pagination-previous-btn'
    );

    // Assert.
    await expect(paginationPreviousBtn).toHaveAttribute('disabled');
  });

  test('should be able to navigate to next page sequentially', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page } = IterationPOM;
    const paginationNextBtn = page.getByTestId('table-pagination-next-btn');
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');

    // Act.
    await paginationNextBtn.click();

    // Assert.
    await expect(paginationPagesText).toHaveText(/Page 2 of/);
  });

  test('should be able navigate to previous page', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page } = IterationPOM;
    const paginationPreviousBtn = page.getByTestId(
      'table-pagination-previous-btn'
    );
    const paginationNextBtn = page.getByTestId('table-pagination-next-btn');
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');

    // Act.
    await paginationNextBtn.click();
    await expect(paginationPagesText).toHaveText(/Page 2 of/);
    await paginationPreviousBtn.click();

    // Assert.
    await expect(paginationPagesText).toHaveText(/Page 1 of/);
  });

  test('should be able to jump to valid pages directly', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page, iterationList } = IterationPOM;
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');
    const goToPageInput = page.getByTestId('table-goto-page-input');

    // Act.
    await goToPageInput.clear();
    await goToPageInput.fill('3');
    await page.keyboard.press('Enter');

    // Assert.
    await expect(iterationList).toBeVisible();
    await expect(paginationPagesText).toHaveText(/Page 3 of/);
  });

  test('should display error when invalid page number provided to input', async ({
    adminIterationPOM: IterationPOM,
  }) => {
    // Arrange.
    const { page } = IterationPOM;
    const goToPageInput = page.getByTestId('table-goto-page-input');

    // Act.
    await goToPageInput.fill('13');
    await page.keyboard.press('Enter');

    const classAttributeValue = await goToPageInput.evaluate(
      (element) => element.className
    );

    // Assert.
    expect(await classAttributeValue.includes('aus-input--error')).toBeTruthy();
  });
});
