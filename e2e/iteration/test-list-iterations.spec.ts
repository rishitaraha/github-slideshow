import { test } from './iteration-fixture';
import { expect } from '@playwright/test';

test('iteration should be visible', async ({
  adminIterationPOM: iterationPOM,
}) => {
  // Arrange.
  const { secondSiteIterationsBtn, iterationList, firstIteration } =
    iterationPOM;

  // Act.
  await secondSiteIterationsBtn.click();

  // Assert.
  await expect(iterationList).toBeVisible();
  await expect(firstIteration).toBeVisible();
});
