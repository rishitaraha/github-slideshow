import { expect } from '@playwright/test';
import { test } from './layer-fixture';

test('layers should be visible', async ({ adminLayerPOM: LayerPOM }) => {
  // Arrange.
  const { layersList, firstLayer } = LayerPOM;

  // Assert.
  await expect(layersList).toBeVisible();
  await expect(firstLayer).toBeVisible();
});
