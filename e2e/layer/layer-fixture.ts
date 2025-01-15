import { test as base } from '../shared/auth-fixtures';
import { LayerPOM } from './layer-pom';

type layerFixtureType = {
  adminLayerPOM: LayerPOM;
};

export const test = base.extend<layerFixtureType>({
  adminLayerPOM: async ({ adminPage }, use) => {
    const layerPOM = new LayerPOM(adminPage.page);
    await layerPOM.goToIterationsListPage();
    await use(layerPOM);
  },
});
