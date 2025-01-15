import { test } from './site-fixture';
import { expect } from '@playwright/test';

test.describe('site pagination', () => {
  test.beforeEach(
    'sites should be visible',
    async ({ adminSitePOM: sitePOM }) => {
      const { page,sitesList } = sitePOM;
      await expect(sitesList).toBeVisible();
      await page.waitForResponse('**/sites?*');
    }
  );

  test('should be able to change the pagination count to 25', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { paginationTest, sitesList } = sitePOM;

    // Act.
    await paginationTest(sitesList, 25);
  });

  test('should be able to change the pagination count to 50', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { paginationTest, sitesList } = sitePOM;

    // Act.
    await paginationTest(sitesList, 50);
  });

  test('should be able to change the pagination count to 100', async ({
    adminSitePOM: sitePOM,
  }) => {
    // Arrange.
    const { paginationTest, sitesList } = sitePOM;

    // Act.
    await paginationTest(sitesList, 100);
  });

  test('should initially have disabled previous button on first page', async ({
    adminSitePOM: SitePOM,
  }) => {
    // Arrange.
    const { page } = SitePOM;
    const paginationPreviousBtn = page.getByTestId(
      'table-pagination-previous-btn'
    );

    // Assert.
    await expect(paginationPreviousBtn).toHaveAttribute('disabled');
  });

  test('should be able to navigate to next page sequentially', async ({
    adminSitePOM: SitePOM,
  }) => {
    // Arrange.
    const { page } = SitePOM;
    const paginationNextBtn = page.getByTestId('table-pagination-next-btn');
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');

    // Act.
    await paginationNextBtn.click();

    // Assert.
    await expect(paginationPagesText).toHaveText(/Page 2 of/);
  });

  test('should be able navigate to previous page', async ({
    adminSitePOM: SitePOM,
  }) => {
    // Arrange.
    const { page } = SitePOM;
    const paginationPreviousBtn = page.getByTestId(
      'table-pagination-previous-btn'
    );
    const paginationNextBtn = page.getByTestId('table-pagination-next-btn');
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');

    // Act.
    await paginationNextBtn.click();
    await paginationPreviousBtn.click();

    // Assert.
    await expect(paginationPagesText).toHaveText(/Page 1 of/);
  });

  test('should be able to jump to valid pages directly', async ({
    adminSitePOM: SitePOM,
  }) => {
    // Arrange.
    const { page, sitesList } = SitePOM;
    const paginationPagesText = page.getByTestId('table-pagination-pages-text');
    const goToPageInput = page.getByTestId('table-goto-page-input');

    // Act.
    await goToPageInput.clear();
    await goToPageInput.fill('3');
    await page.keyboard.press('Enter');

    // Assert.
    await expect(sitesList).toBeVisible();
    await expect(paginationPagesText).toHaveText(/Page 3 of/);
  });

});
