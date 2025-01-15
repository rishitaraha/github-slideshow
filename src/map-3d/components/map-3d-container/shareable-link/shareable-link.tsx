import {
  Fab,
  IconIdentifier,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import {
  selectMap3dWorkspace,
  selectMap3dDataset,
} from 'map-3d/shared/map-3d-slices';
import { useAppSelector } from 'app/hooks';

export const ShareableLinkButton = ({ onClickShareableLink }) => {
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const isLayerOrTerrainSelected =
    !isEmpty(workspaceLayers) || !isNil(selectedTerrainIteration);

  return (
    <Tooltip
      placement={Placement.Left}
      hoverText={
        isLayerOrTerrainSelected
          ? 'Share Workspace'
          : 'Select an Iteration to enable link sharing'
      }
      className="shareable-link__tooltip"
    >
      <Fab
        leftIconIdentifier={IconIdentifier.Share}
        className="shareable-link__btn"
        onClick={onClickShareableLink}
        disabled={!isLayerOrTerrainSelected}
      />
    </Tooltip>
  );
};
