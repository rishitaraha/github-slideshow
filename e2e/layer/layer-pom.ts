import { Page, expect, Locator } from '@playwright/test';
import { IterationPOM } from '../iteration/iteration-pom';

export class LayerPOM extends IterationPOM {
  readonly firstIterationLayerListBtn: Locator;
  readonly secondIterationLayerListBtn: Locator;
  readonly thirdIterationLayerListBtn: Locator;
  readonly layerProject: Locator;
  readonly layersList: Locator;
  readonly firstLayer: Locator;
  readonly addLayerBtn: Locator;
  readonly layerNameInput: Locator;
  readonly layerFileInput: Locator;
  readonly addLayerSideCard: Locator;
  readonly layerTypeSelect: Locator;
  readonly sidecardAddLayerBtn: Locator;
  readonly addLayerSubmitBtn: Locator;

  constructor(page: Page) {
    super(page);
    this.goToIteration = this.goToIteration.bind(this);
    this.firstIterationLayerListBtn =
      this.firstIteration.getByTestId('layers-list-btn');
    this.secondIterationLayerListBtn = this.iterationList
      .locator('> tr:nth-child(2)')
      .getByTestId('layers-list-btn');
    this.thirdIterationLayerListBtn = this.iterationList
      .locator('> tr:nth-child(3)')
      .getByTestId('layers-list-btn');
    this.layersList = this.page.locator('tbody');
    this.firstLayer = this.layersList.locator('> tr:first-child');
    this.addLayerBtn = this.page.getByTestId('add-layer-btn');
    this.layerNameInput = this.page.locator("input[name='name']");
    this.addLayerSideCard = this.page.getByTestId('add-layer-sidecard');
    this.layerFileInput = this.page.locator(
      'input[type="file"][name="layerFile"]'
    );
    this.layerTypeSelect = this.addLayerSideCard.locator(
      "input[id='react-select-8-input']"
    );
    this.sidecardAddLayerBtn = this.addLayerSideCard.getByTestId(
      'add-layer-submit-btn'
    );
    this.addLayerSubmitBtn = this.addLayerSideCard.getByTestId(
      'add-layer-submit-btn'
    );
    this.layerProject = this.page
      .getByTestId('projects-list')
      .locator('> div:nth-child(3)');
  }

  async goToIterationsListPage() {
    const { page, layerProject, firstSiteIterationsBtn } = this;
    await page.goto('/projects');
    await layerProject.click();
    await firstSiteIterationsBtn.click();
  }

  async testPaginatedListForPageCount(pageCount: number): Promise<void> {
    // Arrange.
    const { page, iterationList } = this;
    const paginationCountInput = page.locator('.aus-select__input');

    // Act.
    await paginationCountInput.fill(pageCount.toString());
    await page.keyboard.press('Enter');
    await paginationCountInput.click();

    // Assert.
    await expect(iterationList).toBeVisible();
    await expect(iterationList.locator('[data-row-id]')).toHaveCount(pageCount);
  }
}
