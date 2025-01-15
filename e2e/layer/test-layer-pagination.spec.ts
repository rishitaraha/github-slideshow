import { expect } from '@playwright/test';
import { test } from './layer-fixture';

test.describe('Layer pagination ', () => {
  test.beforeEach(
    'layer list should be visisble',
    async ({ adminLayerPOM: LayerPOM }) => {
      const { layersList, firstLayer, secondIterationLayerListBtn } = LayerPOM;
      await secondIterationLayerListBtn.click();
      await expect(layersList).toBeVisible();
      await expect(firstLayer).toBeVisible();
    }
  );

  test('should be able to change the pagination count to 25', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Act.
    await LayerPOM.testPaginatedListForPageCount(25);
  });

  test('should be able to change the pagination count to 50', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Act.
    await LayerPOM.testPaginatedListForPageCount(50);
  });

  test('should be able to change the pagination count to 100', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Act.
    await LayerPOM.testPaginatedListForPageCount(100);
  });

  test('should have previous button disabled for the first page', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page } = LayerPOM;
    const paginationPreviousBtn = page.getByTestId(
      'table-pagination-previous-btn'
    );

    // Assert.
    await expect(paginationPreviousBtn).toHaveAttribute('disabled');
  });

  test('should be able to navigate to next page sequentially', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page } = LayerPOM;
    const paginationNextBtn = page.getByTestId('table-pagination-next-btn');
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');

    // Act.
    await paginationNextBtn.click();

    // Assert.
    await expect(paginationPagesText).toHaveText(/Page 2 of/);
  });

  test('should be able navigate to previous page', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page } = LayerPOM;
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
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page, layersList } = LayerPOM;
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');
    const goToPageInput = page.getByTestId('table-goto-page-input');

    // Act.
    await page.waitForResponse('**/layers?*');
    await goToPageInput.clear();
    await goToPageInput.fill('3');
    await page.keyboard.press('Enter');

    // Assert.
    await expect(layersList).toBeVisible();
    await expect(paginationPagesText).toHaveText(/Page 3 of/);
  });

  test('should display error when invalid page number provided to input', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page } = LayerPOM;
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
