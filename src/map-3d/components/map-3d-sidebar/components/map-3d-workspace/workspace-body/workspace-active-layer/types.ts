import { WorkspaceLayer } from '../../../../shared';

export type WorkSpaceActiveLayerPropType = {
  layer: WorkspaceLayer;
  className: string;
  isChecked: boolean;
  index: number;
  onClick: (event: React.MouseEvent<HTMLInputElement>, index: number) => void;
};
