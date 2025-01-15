import { LayerType } from '../shared/api';

export const layerTabs = {
  Basic: 'Basic',
  AccessTags: 'Access Tags',
};

export const layerTypesLabel = {
  [LayerType.Vector]: 'Vector',
  [LayerType.Orthomosaic]: 'Orthomosaic',
  [LayerType.MapBox]: 'Mapbox',
  [LayerType.MBTiles]: 'MBTiles',
  [LayerType.Cesium]: 'CESIUM',
  [LayerType.Contour]: 'Contour',
  [LayerType.SlopeMap]: 'Slope Map',
};
