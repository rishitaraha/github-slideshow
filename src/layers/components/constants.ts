import { LayerType } from '../../shared/api';
import { LayersOptionType } from '../types';
import { LayerTypeLabel } from '.';

export const layerTypeLabels: LayerTypeLabel = {
  [LayerType.MBTiles]: 'MBTiles (.mbtiles)',
  [LayerType.Vector]: 'Shape Files (.zip)',
  [LayerType.MapBox]: 'Mapbox ID',
  [LayerType.Orthomosaic]: 'Orthomosaic (.tif)',
};

export const layerTypeOptions: LayersOptionType[] = Object.entries(
  layerTypeLabels,
).map(([value, label]) => {
  return {
    label,
    value: value as LayerType,
  };
});

export const addLayerTypeOption: LayersOptionType[] = Object.entries(
  layerTypeLabels,
).map(([value, label]) => {
  return {
    label,
    value,
  };
}) as LayersOptionType[];

export const initialLayerInputState = {
  name: '',
  type: null,
  sourceId: '',
  accessTags: [],
  layerFile: null,
  clampToTerrain: true,
};
