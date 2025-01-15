import { expect } from '@playwright/test';
import path from 'path';
import { ToastClassName } from '../shared/enums';
import { test } from './layer-fixture';

test.describe('Add layer when layer list is not empty', () => {
  test.beforeEach(
    'layer list should be visisble',
    async ({ adminLayerPOM: LayerPOM }) => {
      const { layersList, firstLayer, secondIterationLayerListBtn } = LayerPOM;
      await secondIterationLayerListBtn.click();
      await expect(layersList).toBeVisible();
      await expect(firstLayer).toBeVisible();
    }
  );

  test('should observe layer file input by default', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page, addLayerBtn, layerFileInput } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();

    // Assert.
    await expect(layerFileInput).toBeVisible();
  });

  test('should disable add layer button when fields are not validated', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page, addLayerBtn, sidecardAddLayerBtn } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();

    // Assert.
    await expect(sidecardAddLayerBtn).toBeDisabled();
  });

  test('should be able to add a layer of type mbtiles', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerFileInput,
      sidecardAddLayerBtn,
      addLayerSubmitBtn,
      firstLayer,
      layerTypeSelect,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-1');
    await layerTypeSelect.fill('MBTiles');
    await page.keyboard.press('Enter');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.mbtiles')
    );
    await sidecardAddLayerBtn.click();
    await page.waitForTimeout(5000);
    await sidecardAddLayerBtn.click();
    await addLayerSubmitBtn.click();

    // Assert.
    await expect(page.locator(ToastClassName.Success)).toHaveText(
      'test-layer-1 added successfully to Layers.'
    );
    await expect(firstLayer).toBeVisible();
  });

  test('should be able to add a layer of type orthomosaic', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerFileInput,
      layerTypeSelect,
      sidecardAddLayerBtn,
      addLayerSubmitBtn,
      firstLayer,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await firstLayer.click();
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-2');
    await layerTypeSelect.fill('orthomosaic');
    await page.keyboard.press('Enter');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );
    await sidecardAddLayerBtn.click();
    await page.waitForTimeout(5000);
    await sidecardAddLayerBtn.click();
    await addLayerSubmitBtn.click();

    // Assert.
    await expect(page.locator(ToastClassName.Success)).toHaveText(
      'test-layer-2 added successfully to Layers.'
    );
    await expect(firstLayer).toBeVisible();
  });

  test('should disable "Next" button if the layer type is changed after file is uploaded', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerFileInput,
      sidecardAddLayerBtn,
      layerTypeSelect,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-1');
    await layerTypeSelect.fill('MBTiles');
    await page.keyboard.press('Enter');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.mbtiles')
    );
    await sidecardAddLayerBtn.click();
    await page.waitForTimeout(5000);
    await layerTypeSelect.fill('orthomosaic');
    await page.keyboard.press('Enter');

    // Assert.
    await expect(sidecardAddLayerBtn).toBeDisabled();
  });

  test('should observe "Next" button after file is uploaded', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerFileInput,
      sidecardAddLayerBtn,
      layerTypeSelect,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-1');
    await layerTypeSelect.fill('MBTiles');
    await page.keyboard.press('Enter');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.mbtiles')
    );
    await sidecardAddLayerBtn.click();
    await page.waitForTimeout(5000);

    // Assert.
    await expect(sidecardAddLayerBtn).toHaveText('Next');
    await expect(sidecardAddLayerBtn).toBeEnabled();
  });

  test('should show source id input field when layer type is changed to mapbox', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const { page, addLayerBtn, layerNameInput, layerTypeSelect } = LayerPOM;
    const mapboxIdInput = page.locator("input[name='sourceId']");

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-2');
    await layerTypeSelect.fill('mapbox');
    await page.keyboard.press('Enter');

    // Assert.
    await expect(mapboxIdInput).toBeVisible();
  });

  test('should add a layer of type mapbox', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      addLayerSideCard,
      layerNameInput,
      layerTypeSelect,
      sidecardAddLayerBtn,
      addLayerSubmitBtn,
      firstLayer,
    } = LayerPOM;
    const mapboxIdInput = page.locator("input[name='sourceId']");

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-2');
    await layerTypeSelect.fill('mapbox');
    await page.keyboard.press('Enter');
    await mapboxIdInput.fill('123456');
    await sidecardAddLayerBtn.click();
    await addLayerSubmitBtn.click();

    // Assert.
    await expect(addLayerSideCard).not.toBeVisible();
    await expect(page.locator(ToastClassName.Success)).toHaveText(
      'test-layer-2 added successfully to Layers.'
    );
    await expect(firstLayer).toBeVisible();
  });

  test('should display "Validation Error" when submitted without filling mandatory fields', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerTypeSelect,
      layerFileInput,
      sidecardAddLayerBtn,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerFileInput.click();
    await layerNameInput.click();
    await layerTypeSelect.focus();

    // Assert.
    await expect(sidecardAddLayerBtn).toBeDisabled();
    await expect(page.locator('.aus-input__error').first()).toBeVisible();
    await expect(page.locator('.aus-input__error').nth(1)).toBeVisible();
  });

  test('should validate when uploaded file is not matching with file type', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      addLayerBtn,
      layerNameInput,
      layerFileInput,
      sidecardAddLayerBtn,
    } = LayerPOM;

    // Act.
    await page.waitForResponse('**/layers?*');
    await addLayerBtn.click();
    await layerNameInput.fill('test-layer-3');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.tif')
    );

    // Assert.
    await expect(sidecardAddLayerBtn).toBeDisabled();
  });
});

test.describe('Add layer when layer list is empty', () => {
  test.beforeEach(
    'layer list should be visisble',
    async ({ adminLayerPOM: LayerPOM }) => {
      const { page, thirdIterationLayerListBtn } = LayerPOM;
      await thirdIterationLayerListBtn.click();
      await expect(page.getByTestId('add-layer-btn-initial')).toBeEnabled();
    }
  );

  test('should add a layer when no layer exists in the table', async ({
    adminLayerPOM: LayerPOM,
  }) => {
    // Arrange.
    const {
      page,
      layerNameInput,
      layerFileInput,
      sidecardAddLayerBtn,
      addLayerSubmitBtn,
      firstLayer,
    } = LayerPOM;

    // Act.
    await page.getByTestId('add-layer-btn-initial').click();
    await layerNameInput.fill('test-layer-1');
    await page
      .getByTestId('add-layer-sidecard')
      .locator('input.aus-select__input[role="combobox"]')
      .fill('MBTiles');
    await page.keyboard.press('Enter');
    await layerFileInput.setInputFiles(
      path.join(__dirname, '../assets/base-dsm.mbtiles')
    );
    await sidecardAddLayerBtn.click();
    await page.waitForTimeout(5000);
    await sidecardAddLayerBtn.click();
    await addLayerSubmitBtn.click();

    // Assert.
    await expect(page.locator(ToastClassName.Success)).toHaveText(
      'test-layer-1 added successfully to Layers.'
    );
    await expect(firstLayer).toBeVisible();
  });
});
