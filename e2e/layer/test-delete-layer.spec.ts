import { expect } from '@playwright/test';
import { ToastClassName } from '../shared/enums';
import { test } from './layer-fixture';

test.describe('Delete Layer', () => {
  test.beforeEach(
    'layer list should be visible',
    async ({ adminLayerPOM: LayerPOM }) => {
      const { layersList, firstLayer, secondIterationLayerListBtn } = LayerPOM;
      await secondIterationLayerListBtn.click();
      await expect(layersList).toBeVisible();
      await expect(firstLayer).toBeVisible();
    }
  );

  test('test should be able to delete a layer ', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { firstLayer, page } = LayerPOM;

    // Act.
    await firstLayer.getByTestId('delete-layer-button').click();
    await page.getByTestId('confirm-delete-layer-button').click();

    // Assert.
    await expect(page.locator(ToastClassName.Success)).toHaveText(
      'Layer deleted successfully.'
    );
  });

  test('test should be able to cancel deleting a layer ', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { firstLayer, page } = LayerPOM;
    const cancelDeleteLayerBtn = page.getByTestId('cancel-delete-layer-button');

    // Act.
    await firstLayer.getByTestId('delete-layer-button').click();
    await cancelDeleteLayerBtn.click();

    // Assert.
    await expect(cancelDeleteLayerBtn).not.toBeVisible();
  });
});
