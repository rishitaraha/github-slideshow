import { SelectOption } from '@aus-platform/design-system';
import { HRAInputFieldType } from './types';
import { HaulRoadLayerType } from './enums';
import { Formatter } from 'src/shared/helpers';

export const haulRoadLayersType: SelectOption[] = [
  {
    label: Formatter.toTitleCase(HaulRoadLayerType.CenterLineLayer),
    value: HaulRoadLayerType.CenterLineLayer,
  },
  {
    label: Formatter.toTitleCase(HaulRoadLayerType.EdgesLayer),
    value: HaulRoadLayerType.EdgesLayer,
  },
];

export const hraInitialState: HRAInputFieldType = {
  haulRoadName: '',
  vehicleWidth: 7,
  chainageInterval: 10,
  haulRoadLayersType: haulRoadLayersType[0],
  haulRoadType: undefined,
  workspaceLayer: null,
  haulRoadMedianLayer: null,
};
