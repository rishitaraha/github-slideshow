import { Spinner, StatusIndicatorLevel } from '@aus-platform/design-system';
import {
  chain,
  filter,
  find,
  isEmpty,
  isNil,
  isUndefined,
  size,
  values,
} from 'lodash';

import { memo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { SelectLayerList, SelectLayerListItem } from '../../../../../shared';
import { zoomToLayer } from '../../../shared';
import {
  addCapturedDsmMapLayer,
  createSelectLayerList,
  createWorkspaceLayer,
} from '../../../workspace-body';
import { filterListBySearchQuery } from '../helpers';
import { handleOrthoTerrainProcessingMessages, zoomToSite } from './helpers';
import { WorkSpaceSelectLayer } from './workspace-select-layer';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';
import { BatchJobStatus } from 'shared/enums';
import { LayerListResponse, LayerType, useLayerList } from 'shared/api';
import { Map3DCapturedDsmLayerType } from 'map-3d/types';
import {
  addTerrainLayer,
  addWorkspaceLayer,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setSelectedTerrainIteration,
  setSelectedTerrainSite,
} from 'map-3d/shared/map-3d-slices';

type SidecardLayerListProps = {
  searchQuery?: string;
};

export const SidecardLayerList: React.FC<SidecardLayerListProps> = memo(
  ({ searchQuery }) => {
    // Selectors.
    const { activeWorkspaceIteration, selectedProject, activeWorkspaceSite } =
      useAppSelector(selectMap3dDataset);
    const { cesiumProxy } = useAppSelector(selectMap3DState);
    const { workspaceLayers: workspaceLayerList, terrainProvider } =
      useAppSelector(selectMap3dWorkspace);

    // States.
    const [selectLayers, setSelectLayers] = useState<SelectLayerList>();
    const [capturedDsmLayer, setCapturedDsmLayer] =
      useState<Map3DCapturedDsmLayerType | null>(null);

    // Dispatcher.
    const dispatch = useAppDispatch();

    // Constants.
    const isDSMPresent =
      activeWorkspaceIteration?.capturedDsm?.status ===
      StatusIndicatorLevel.Done;

    const terrainStatus = activeWorkspaceIteration?.terrainTiles?.status;

    const { workspaceId } = useParams();

    // Apis.
    const {
      data: layerListResponse,
      isPending: isLoadingLayerList,
      isSuccess: isSuccessLayerList,
    } = useLayerList(
      {
        iterationId: activeWorkspaceIteration?.id ?? '',
        includeFields: [
          'id',
          'name',
          'type',
          'status',
          'areaCategory',
          'files',
          'tiles',
          'properties',
          'createdAt',
        ],
      },
      !isNil(activeWorkspaceIteration),
    );

    // useEffects.
    useEffect(() => {
      if (isNil(activeWorkspaceIteration)) {
        return;
      }

      const { id, capturedDsmCog } = activeWorkspaceIteration;

      if (!isNil(capturedDsmCog)) {
        const dsmLayer = addCapturedDsmMapLayer(id, capturedDsmCog);
        setCapturedDsmLayer(dsmLayer);
      }
    }, [activeWorkspaceIteration]);

    useEffect(() => {
      if (
        isLoadingLayerList ||
        !isSuccessLayerList ||
        isUndefined(layerListResponse) ||
        isNil(activeWorkspaceIteration)
      ) {
        return;
      }

      const selectLayersList = createSelectLayerFilteredList(
        layerListResponse,
        searchQuery,
        capturedDsmLayer || undefined,
      );

      setSelectLayers(selectLayersList);

      // Don't autoload ortho when user is loading a workspace.
      if (isNil(workspaceId)) {
        handleAutoLoadOrthoAndTerrain(selectLayersList);
      }
    }, [isSuccessLayerList, layerListResponse, capturedDsmLayer]);

    useEffect(() => {
      if (layerListResponse) {
        const newSelectLayerList = createSelectLayerFilteredList(
          layerListResponse,
          searchQuery,
          capturedDsmLayer || undefined,
        );

        setSelectLayers(newSelectLayerList);
      }
    }, [searchQuery]);

    // Handlers.
    const handleAutoLoadOrthoAndTerrain = (
      selectLayersList: SelectLayerList,
    ) => {
      const isOrthoAddedToWorkspace = !isNil(
        find(workspaceLayerList, {
          type: LayerType.Orthomosaic,
        }),
      );

      const autoLoadOrthoAndTerrain =
        isNil(terrainProvider) && !isOrthoAddedToWorkspace;

      // If iterationList is not mounted, return from here without performing auto-loading.
      if (!activeWorkspaceIteration || !autoLoadOrthoAndTerrain) {
        return;
      }

      // Sorting Layers based on priority to the done status of layers.
      const orthoLayersList: SelectLayerListItem[] = chain(selectLayersList)
        .filter({ type: LayerType.Orthomosaic })
        .sortBy((layer) =>
          layer.layerStatus === StatusIndicatorLevel.Done ? 0 : 1,
        )
        .value();

      // A possible valid layer for checking the conditions.
      const firstOrthoLayer: SelectLayerListItem = orthoLayersList[0];

      // List containing only valid ortho layers.
      const readyToAddOrthoLayers: SelectLayerListItem[] = filter(
        orthoLayersList,
        { layerStatus: StatusIndicatorLevel.Done },
      );

      const canAddOrtho =
        !isNil(firstOrthoLayer) &&
        !isNil(firstOrthoLayer.layerStatus) &&
        firstOrthoLayer.layerStatus === StatusIndicatorLevel.Done;

      const canAddTerrain =
        !isNil(terrainStatus) && terrainStatus === BatchJobStatus.Completed;

      handleOrthoTerrainProcessingMessages(
        activeWorkspaceIteration,
        firstOrthoLayer,
      );

      // Add ortho to workspace.
      if (canAddOrtho) {
        addOrthoLayer(readyToAddOrthoLayers);
      }

      // Add terrain to workspace.
      if (canAddTerrain) {
        selectTerrain(canAddOrtho);
      }
    };

    const addOrthoLayer = (orthoLayerList: SelectLayerListItem[]) => {
      if (
        !cesiumProxy ||
        !activeWorkspaceIteration ||
        !selectedProject ||
        !activeWorkspaceSite
      ) {
        return;
      }

      orthoLayerList.forEach((orthoLayer, index) => {
        const workspaceLayer = createWorkspaceLayer({
          layer: orthoLayer,
          project: selectedProject,
          site: activeWorkspaceSite,
          iteration: activeWorkspaceIteration,
        });

        // Zoom only to the latest ortho layer.
        if (index === 0) {
          zoomToLayer(workspaceLayer, cesiumProxy, activeWorkspaceSite);
        }
        dispatch(addWorkspaceLayer(workspaceLayer));
      });
    };

    const selectTerrain = async (canAddOrtho) => {
      // Reset the terrain provider first.
      cesiumProxy?.layerManager.resetTerrainProvider();

      const terrainInfo = activeWorkspaceIteration?.terrainTiles;
      const iterationId = activeWorkspaceIteration?.id;

      if (cesiumProxy) {
        let terrainProvider;
        const isTerrainProcessing =
          isDSMPresent &&
          (terrainStatus === BatchJobStatus.Started ||
            terrainStatus === BatchJobStatus.Processing);

        if (!isNil(iterationId) && !isNil(terrainInfo)) {
          terrainProvider = await cesiumProxy.layerManager.addTerrain(
            iterationId,
            terrainInfo?.path,
          );
        }

        dispatch(
          addTerrainLayer({
            show: !isTerrainProcessing,
            terrainProvider,
            processing: isTerrainProcessing,
          }),
        );
      }

      if (
        !isNil(activeWorkspaceSite) &&
        !isNil(activeWorkspaceSite?.canManageIterationsAndLayers) &&
        !isNil(activeWorkspaceIteration)
      ) {
        dispatch(setSelectedTerrainSite(activeWorkspaceSite));
        dispatch(
          setSelectedTerrainIteration({
            ...activeWorkspaceIteration,
            canManageIterations:
              activeWorkspaceSite?.canManageIterationsAndLayers,
          }),
        );
      }

      // Zoom to terrain only if user cannot add ortho.
      if (!isNil(activeWorkspaceSite) && !canAddOrtho) {
        zoomToSite(cesiumProxy, activeWorkspaceSite);
      }
    };

    // Helpers.
    const createSelectLayerFilteredList = (
      layerListResponse: LayerListResponse,
      searchQuery: string | undefined,
      capturedDsmLayer?: Map3DCapturedDsmLayerType,
    ): SelectLayerList => {
      const selectLayerList: SelectLayerList = createSelectLayerList(
        layerListResponse.list,
        layerListResponse.canManageLayers,
        capturedDsmLayer || undefined,
      );

      const filteredLayers = filterListBySearchQuery<SelectLayerListItem>(
        searchQuery,
        values(selectLayerList),
      ).reduce((prevValue: SelectLayerList, { id, ...rest }) => {
        prevValue[id] = { id, ...rest };
        return prevValue;
      }, {});

      return filteredLayers;
    };

    // Renders.
    if (isLoadingLayerList) {
      return <Spinner />;
    } else if (isEmpty(selectLayers)) {
      return <div className="workspace-empty-list">No layers to display.</div>;
    } else if (size(selectLayers) > 0) {
      return Object.entries(selectLayers).map(([id, layer]) => (
        <WorkSpaceSelectLayer key={id} layer={layer} />
      ));
    }
  },
);
