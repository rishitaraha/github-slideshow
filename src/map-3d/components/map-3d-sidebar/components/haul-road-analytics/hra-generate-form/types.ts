import { SelectOption } from '@aus-platform/design-system';
import { WorkspaceLayer } from '../../../shared';

export type HaulRoadType = {
  id: string;
  name: string;
};

export type HRAInputFieldType = {
  haulRoadName: string;
  haulRoadType: SelectOption<HaulRoadType> | undefined;
  vehicleWidth: number;
  chainageInterval: number;
  haulRoadLayersType: SelectOption<string>;
  workspaceLayer: SelectOption<WorkspaceLayer> | null;
  haulRoadMedianLayer: SelectOption<WorkspaceLayer> | null;
};
