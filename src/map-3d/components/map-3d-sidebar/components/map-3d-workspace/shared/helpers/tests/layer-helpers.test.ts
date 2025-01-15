import { filter, values } from 'lodash';
import { setVectorLayerVisibility, sortLayers } from '../layer-helpers';
import { mockWorkspaceLayer } from './mock';
import { LayerType } from 'src/shared/api';

describe('sortLayers test', () => {
  it('should sort layers by descending zIndex when all zIndices are defined', () => {
    // Arrange.
    const layer1 = mockWorkspaceLayer({ zIndex: 2 });
    const layer2 = mockWorkspaceLayer({ zIndex: 1 });
    const layer3 = mockWorkspaceLayer({ zIndex: 20 });

    const unsortedLayers = [layer1, layer2, layer3];
    const expectedSortedLayers = [layer3, layer1, layer2];

    // Act.
    const actualSortedLayers = sortLayers(unsortedLayers);

    // Assert.
    expect(actualSortedLayers).toEqual(expectedSortedLayers);
  });

  it('should sort layers correctly when zIndex values are mixed (defined and undefined)', () => {
    // Arrange.
    const layer1 = mockWorkspaceLayer({ zIndex: 9999 });
    const layer2 = mockWorkspaceLayer({ zIndex: undefined });
    const layer3 = mockWorkspaceLayer({ zIndex: 100000 });
    const layer4 = mockWorkspaceLayer({ zIndex: 99200 });

    const unsortedLayers = [layer1, layer2, layer3, layer4];
    const expectedSortedLayers = [layer2, layer3, layer4, layer1];

    // Act.
    const actualSortedLayers = sortLayers(unsortedLayers);

    // Assert.
    expect(actualSortedLayers).toEqual(expectedSortedLayers);
  });

  it('should handle an empty array', () => {
    // Arrange.
    const unsortedLayers = [];
    const expectedSortedLayers = [];

    // Act.
    const actualSortedLayers = sortLayers(unsortedLayers);

    // Assert.
    expect(actualSortedLayers).toEqual(expectedSortedLayers);
  });
});

describe('setVectorLayerVisibility test', () => {
  it('should set map layer visibility true for all vector layers', () => {
    // Arrange.
    const layer1 = mockWorkspaceLayer({ type: LayerType.Vector, show: false });
    const layer2 = mockWorkspaceLayer({ type: LayerType.Vector, show: false });

    const workspaceLayers = {
      [layer1.id]: layer1,
      [layer2.id]: layer2,
    };

    // Act.
    setVectorLayerVisibility(workspaceLayers, true);

    // Assert.
    values(workspaceLayers).forEach((layer) => {
      expect(layer.mapLayer?.show).toBe(true);
    });
  });

  it('should set map layer visibility false for all vector layers', () => {
    // Arrange.
    const layer1 = mockWorkspaceLayer({ type: LayerType.Vector, show: true });
    const layer2 = mockWorkspaceLayer({ type: LayerType.Vector, show: true });

    const workspaceLayers = {
      [layer1.id]: layer1,
      [layer2.id]: layer2,
    };

    // Act.
    setVectorLayerVisibility(workspaceLayers, false);

    // Assert.
    values(workspaceLayers).forEach((layer) => {
      expect(layer.mapLayer?.show).toBe(false);
    });
  });

  it('should only affect vector layers when mixed types are present', () => {
    // Arrange.
    const vectorLayer = mockWorkspaceLayer({
      type: LayerType.Vector,
      show: true,
    });
    const slopeMapLayer = mockWorkspaceLayer({
      type: LayerType.SlopeMap,
      show: true,
    });
    const dsmLayer = mockWorkspaceLayer({
      type: LayerType.CapturedDsm,
      show: true,
    });

    const workspaceLayers = {
      [vectorLayer.id]: vectorLayer,
      [slopeMapLayer.id]: slopeMapLayer,
      [dsmLayer.id]: dsmLayer,
    };

    // Act.
    setVectorLayerVisibility(workspaceLayers, false);

    // Assert.
    const vectorLayers = filter(
      workspaceLayers,
      ({ type }) => type === LayerType.Vector,
    );

    const otherLayers = filter(
      workspaceLayers,
      ({ type }) => type !== LayerType.Vector,
    );

    vectorLayers.forEach((layer) => {
      expect(layer.mapLayer?.show).toBe(false);
    });

    otherLayers.forEach((layer) => {
      expect(layer.mapLayer?.show).toBe(true);
    });
  });

  it('should handle an empty object without throwing errors', () => {
    // Arrange.
    const workspaceLayers = {};

    // Act.
    const action = () => setVectorLayerVisibility(workspaceLayers, true);

    // Assert.
    expect(action).not.toThrow();
  });
});
