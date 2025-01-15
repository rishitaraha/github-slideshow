import {
  ColorClass,
  Icon,
  IconIdentifier,
  Placement,
  Spinner,
  toast,
  Tooltip,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isNil } from 'lodash';
import React, { useEffect } from 'react';
import {
  createWorkspaceLayer,
  FileStatusIndicatorMapping,
} from '../../../map-3d-workspace';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  removeWorkspaceLayers,
  selectMap3dDataset,
  selectMap3DState,
  selectMap3dWorkspace,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import {
  handleResponseErrorMessage,
  HaulRoadLayer,
  useLayer,
} from 'shared/api';
import {
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from 'map-3d/components/map-3d-sidebar/shared/types';
import { FileStatus } from 'shared/enums';

type HaulRoadDetailsLayerProps = {
  haulRoadLayer: HaulRoadLayer;
};

export const HaulRoadDetailsLayer: React.FC<HaulRoadDetailsLayerProps> = ({
  haulRoadLayer,
}) => {
  // Redux.
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const { selectedTerrainIteration, selectedTerrainSite, selectedProject } =
    useAppSelector(selectMap3dDataset);
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  const dispatch = useAppDispatch();
  const updateLayer = (layers: WorkspaceLayerListObj) => {
    dispatch(updateWorkspaceLayer(layers));
  };

  // API.
  // Adding "haulRoadLayer" key so that the same API call is not made again when we go to the workspace (active layer component).
  const {
    data: layerResponse,
    error: layerResponseError,
    isSuccess: isSuccessLayerResponse,
    isError: isErrorLayerResponse,
    isFetching: isLoadingLayerResponse,
    refetch: fetchLayer,
  } = useLayer(haulRoadLayer.layer.id ?? '', false, 'haulRoadLayer');

  // Constants.
  const isLoadingHaulRoadLayer =
    isLoadingLayerResponse ||
    haulRoadLayer.layer.status === FileStatus.Processing;

  const isDisabledHaulRoad =
    isLoadingHaulRoadLayer ||
    haulRoadLayer.layer.status !== FileStatus.Done ||
    haulRoadLayer.layer.isDeleted;

  const haulRoadLayerClassname = classNames('haul-road-details-layers__layer', {
    'haul-road-details-layers__layer--disabled': isDisabledHaulRoad,
  });

  const isLayerPresentOnWorkspace = !isNil(
    workspaceLayers[haulRoadLayer.layer.id],
  );

  // useEffects.
  useEffect(() => {
    handleResponseErrorMessage(isErrorLayerResponse, layerResponseError);
  }, [isErrorLayerResponse, layerResponseError]);

  // useEffect - Add map layer.
  useEffect(() => {
    if (!isSuccessLayerResponse || !layerResponse) {
      return;
    }

    onLayerResponseSuccess();
  }, [layerResponse, isSuccessLayerResponse]);

  // Handlers.
  const onClickAddToWorkspace = () => {
    fetchLayer();
  };

  const onClickRemoveFromWorkspace = (haulRoadLayerId: string) => {
    const workspaceLayer = workspaceLayers[haulRoadLayerId];

    if (isNil(workspaceLayer)) {
      return;
    }

    const mapLayer = workspaceLayer.mapLayer;
    mapLayer && cesiumProxy?.layerManager.removeImageryLayers([mapLayer]);

    dispatch(removeWorkspaceLayers([workspaceLayer.id]));

    toast.success('Layer successfully removed from the workspace');
  };

  // Helpers.
  const onLayerResponseSuccess = async () => {
    const canAddLayerToWorkspace =
      !isNil(layerResponse) &&
      !isNil(selectedTerrainIteration) &&
      !isNil(selectedProject) &&
      !isNil(selectedTerrainSite);

    if (!canAddLayerToWorkspace) {
      return;
    }

    const workspaceLayer = createWorkspaceLayer({
      layer: layerResponse,
      project: selectedProject,
      site: selectedTerrainSite,
      iteration: selectedTerrainIteration,
    });

    const updatedLayer: WorkspaceLayer = {
      ...workspaceLayer,
      layerStatus: FileStatusIndicatorMapping[layerResponse.status],
    };

    const mapLayer = await cesiumProxy?.layerManager.addMapLayer({
      layer: updatedLayer,
      show: true,
    });

    const zIndex = cesiumProxy?.layerManager.getZIndex(mapLayer);

    updateLayer({
      [workspaceLayer.id]: {
        ...workspaceLayer,
        mapLayer,
        zIndex,
        show: true,
      },
    });

    toast.success('Layer added to the workspace');
  };

  // @TODO - Create a separate component for this.
  const renderActionsButton = () => {
    if (haulRoadLayer.layer.isDeleted) {
      return (
        <Tooltip hoverText="Layer has been deleted" placement={Placement.Right}>
          <Icon
            identifier={IconIdentifier.ExclamationCircle}
            size={18}
            colorClass={ColorClass.Red500}
          />
        </Tooltip>
      );
    } else if (haulRoadLayer.layer.status === FileStatus.Failed) {
      return (
        <Tooltip
          hoverText="Layer generation failed"
          placement={Placement.Right}
        >
          <Icon
            identifier={IconIdentifier.ExclamationCircle}
            size={18}
            colorClass={ColorClass.Red500}
          />
        </Tooltip>
      );
    } else if (isLoadingHaulRoadLayer) {
      return <Spinner className="haul-road-details-layers__layer__spinner" />;
    } else {
      return (
        <div className="haul-road-details-layers__layer__actions">
          {isLayerPresentOnWorkspace && (
            <Icon
              identifier={IconIdentifier.IconSubtract}
              cursor={true}
              onClick={() => onClickRemoveFromWorkspace(haulRoadLayer.layer.id)}
            />
          )}
          {!isLayerPresentOnWorkspace && (
            <Icon
              identifier={IconIdentifier.IconAdd}
              cursor={true}
              onClick={() => onClickAddToWorkspace()}
            />
          )}
        </div>
      );
    }
  };

  return (
    <div className={haulRoadLayerClassname}>
      <div className="haul-road-details-layers__layer__text">
        {haulRoadLayer.layer.name}
      </div>
      {renderActionsButton()}
    </div>
  );
};
