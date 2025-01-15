import { WorkspaceLayer } from 'map-3d/components/map-3d-sidebar/shared';

export type LayerActionItemProps = {
  layer: WorkspaceLayer;
  refetchFeatures: VoidFunction;
};

export enum LayerAction {
  Zoom = 'zoom',
  Edit = 'edit',
  ToggleVisibility = 'toggleVisibility',
  Info = 'info',
}
