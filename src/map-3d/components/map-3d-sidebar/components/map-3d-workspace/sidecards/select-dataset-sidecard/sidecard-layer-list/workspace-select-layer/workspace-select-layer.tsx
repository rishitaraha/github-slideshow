import {
  Input,
  StatusIndicatorLevel,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil, omit, size, values } from 'lodash';
import React, { memo, useRef } from 'react';
import { LayerIcon } from '../../../../shared/components/layer-icon';
import { ListItem } from '../../../../../../shared/components/list-item';
import { createWorkspaceLayer } from '../../../../workspace-body';
import {
  removeWorkspaceLayersFromMap,
  updateWorkspaceLayerZIndices,
  zoomToLayer,
} from 'map-3d/components/map-3d-sidebar/components/map-3d-workspace/shared';
import {
  SelectLayerListItem,
  WorkspaceLayerListObj,
} from 'map-3d/components/map-3d-sidebar';
import { DateTimeFormatLength } from 'shared/utils/enums';
import {
  addWorkspaceLayer,
  removeWorkspaceLayers,
  resetPropertiesLayer,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentEditableLayerId,
  setShowUnsavedFeaturesModal,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

type WorkSpaceSelectLayerProps = {
  layer: SelectLayerListItem;
};

export const WorkSpaceSelectLayer: React.FC<WorkSpaceSelectLayerProps> = memo(
  ({ layer }) => {
    // Refs.
    const checkboxRef = useRef<HTMLInputElement>(null);

    // Dispatcher.
    const dispatch = useAppDispatch();

    // Selectors.
    const {
      workspaceLayers: workspaceLayerList,
      currentEditableLayerId,
      currentPropertyLayerId,
      drawingTools,
      actionTools,
    } = useAppSelector(selectMap3dWorkspace);
    const { activeWorkspaceIteration, activeWorkspaceSite, selectedProject } =
      useAppSelector(selectMap3dDataset);
    const { cesiumProxy } = useAppSelector(selectMap3DState);

    // Constants.
    const isLayerFileProcessing =
      layer.layerStatus !== StatusIndicatorLevel.Done &&
      layer.layerStatus !== StatusIndicatorLevel.Completed;
    const isLayerSelected = layer.id in workspaceLayerList;

    // Handlers.
    const updateLayer = (layer: WorkspaceLayerListObj) => {
      dispatch(updateWorkspaceLayer(layer));
    };

    const onClickSelectLayer = (event) => {
      event.stopPropagation();

      const canAddLayerToWorkspace =
        !isLayerFileProcessing &&
        !isNil(cesiumProxy) &&
        !isNil(activeWorkspaceIteration) &&
        !isNil(selectedProject) &&
        !isNil(activeWorkspaceSite);

      if (!canAddLayerToWorkspace) {
        return;
      }

      const isLayerSelected = layer.id in workspaceLayerList;

      // Selecting Layer.
      if (!isLayerSelected) {
        const workspaceLayer = createWorkspaceLayer({
          layer,
          project: selectedProject,
          site: activeWorkspaceSite,
          iteration: activeWorkspaceIteration,
        });

        // Zoom to 1st layer selected.
        if (size(workspaceLayerList) === 0) {
          zoomToLayer(workspaceLayer, cesiumProxy, activeWorkspaceSite);
        }

        dispatch(addWorkspaceLayer(workspaceLayer));
      }
      // Deselecting Layer.
      else {
        // Reset editable layer state, if the layer being toggled is in editable mode.
        if (layer.id === currentEditableLayerId) {
          // Handler unsaved features changes.
          if (drawingTools?.checkUnsavedFeatures()) {
            dispatch(setShowUnsavedFeaturesModal(true));
            return;
          }

          dispatch(setCurrentEditableLayerId(null));

          // Clear current state of all tools.
          drawingTools?.resetAllDrawnFeatureArrays();

          // Deactivate all tools.
          drawingTools?.deactivateAllTools();
          actionTools?.deactivateAllTools();
        }

        if (layer.id === currentPropertyLayerId) {
          dispatch(resetPropertiesLayer());
        }

        removeWorkspaceLayersFromMap(
          [workspaceLayerList[layer.id]],
          drawingTools,
          cesiumProxy,
        );

        if (cesiumProxy) {
          const workspaceLayerListAfterRemovingLayer = values(
            omit(workspaceLayerList, [layer.id]),
          );

          // Update z-index of layers present in redux by fetching latest z-index from Cesium.
          updateWorkspaceLayerZIndices(
            cesiumProxy,
            workspaceLayerListAfterRemovingLayer,
            updateLayer,
          );
        }

        dispatch(removeWorkspaceLayers([layer.id]));
      }
    };

    // Renders.
    return (
      <ListItem
        className="workspace-select-layer"
        onClick={() => {
          checkboxRef?.current?.click();
        }}
        disabled={isLayerFileProcessing}
      >
        <ListItem.Avatar>
          <LayerIcon layer={layer} />
        </ListItem.Avatar>
        <ListItem.Content>
          <span className="workspace-select-layer__name">
            <Tooltip hoverText={layer.name}>{layer.name}</Tooltip>
          </span>

          {layer.createdAt && (
            <div className="workspace-select-layer__date">
              Created:{' '}
              {layer.createdAt.formatDate(DateTimeFormatLength.Medium, ' ')}
            </div>
          )}
        </ListItem.Content>
        <ListItem.Action className="workspace-select-layer__checkbox">
          <Input.CheckBox
            onClick={onClickSelectLayer}
            checked={isLayerSelected}
            disabled={isLayerFileProcessing}
            ref={checkboxRef}
          />
        </ListItem.Action>
      </ListItem>
    );
  },
);
