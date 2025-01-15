import { Spinner, toast } from '@aus-platform/design-system';
import { Cartesian3 } from 'cesium';
import { isEmpty, isNil, isUndefined } from 'lodash';
import React, { useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { GlobalContext } from '../shared/context';
import { ComponentRoute } from '../shared/types';
import {
  addCapturedDsmMapLayer,
  createDSMLayer,
  createWorkspaceLayer,
  Map3DContainer,
  Map3DSideBar,
} from './components';
import { map3dSidebarItems } from './components/map-3d-sidebar/constants';
import { getCartographicDegreeFromCartesian } from './shared';
import {
  addWorkspaceLayer,
  selectMap3DState,
  setActiveSidebarOption,
  setActiveWorkspaceIteration,
  setActiveWorkspaceSite,
  setCanManageIterationsAndLayers,
  setIsWorkspaceLoading,
  setRightSideCard,
  setSelectedProject,
  setSelectedTerrainIteration,
  setSelectedTerrainSite,
  WorkspaceRightSideCard,
} from './shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';
import { RoutesEnum } from 'shared/routes';
import { ErrorSlugs } from 'shared/enums';
import {
  handleResponseErrorMessage,
  useWorkspace,
  WorkspaceMappedResponse,
} from 'shared/api';

export const Map3D: React.FC & ComponentRoute = () => {
  // Dispatch.
  const dispatch = useAppDispatch();

  // Context.
  const { loggedUser } = useContext(GlobalContext);

  // Hooks.
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  // Selector.
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // Apis.
  const {
    data: workspaceData,
    isSuccess: isSuccessWorkspaceResponse,
    isLoading: isLoadingWorkspaceResponse,
    isError: isErrorWorkspaceResponse,
    error: workspaceResponseError,
  } = useWorkspace(workspaceId);

  // useEffects.
  useEffect(() => {
    if (isSuccessWorkspaceResponse && workspaceData) {
      loadWorkspace(workspaceData);

      // set flag to start loading map layers of workspace.
      dispatch(setIsWorkspaceLoading(isSuccessWorkspaceResponse));
    }
  }, [isSuccessWorkspaceResponse, workspaceData, cesiumProxy]);

  useEffect(() => {
    if (workspaceResponseError?.meta.slug === ErrorSlugs.PermissionDenied) {
      toast.error(
        'You do not have access to this view as you do not have access to some layers. Please contact your Org Admin for access.',
      );
    }
    // According to AC, if the link is invalid because the user belongs to a different organization, we need to display a 404 page. If the link is invalid for other reasons, we should show a toast message.
    else if (
      workspaceResponseError?.meta.status_code === 404 &&
      workspaceResponseError.meta.slug === ''
    ) {
      navigate(RoutesEnum.PageNotFound);
    } else {
      handleResponseErrorMessage(
        isErrorWorkspaceResponse,
        workspaceResponseError,
      );
    }
  }, [isErrorWorkspaceResponse, workspaceResponseError]);

  // Handlers.
  const loadWorkspace = (workspace: WorkspaceMappedResponse) => {
    const {
      longitude: longitudeInRadians,
      latitude: latitudeInRadians,
      height,
      heading,
      roll,
      pitch,
    } = workspace.camera;

    const position = Cartesian3.fromRadians(
      longitudeInRadians,
      latitudeInRadians,
      height,
    );
    const [longitude, latitude] = getCartographicDegreeFromCartesian(position);

    dispatch(
      setSelectedProject({
        id: workspace.project.id,
        name: workspace.project.name,
      }),
    );

    if (
      !isEmpty(workspace.selectedSite.name) &&
      !isEmpty(workspace.selectedIteration.name)
    ) {
      dispatch(setActiveWorkspaceSite(workspace.selectedSite));
      dispatch(setActiveWorkspaceIteration(workspace.selectedIteration as any));
      dispatch(
        setCanManageIterationsAndLayers(
          workspace.selectedSite.canManageIterationsAndLayers,
        ),
      );
    }

    if (workspace.terrainIteration.id) {
      dispatch(
        setSelectedTerrainIteration({
          ...workspace.terrainIteration,
          canManageIterations:
            workspace.selectedSite.canManageIterationsAndLayers,
        }),
      );

      cesiumProxy?.layerManager.addTerrain(
        workspace.terrainIteration.id,
        workspace.terrainIteration.terrainTiles.path,
      );

      dispatch(setSelectedTerrainSite(workspace.terrainSite));
    }

    dispatch(setActiveSidebarOption(map3dSidebarItems[0]));

    const layers = workspace.workspaceLayers;
    const dsmLayers = workspace.dsmLayers;

    if (isEmpty(layers) && isEmpty(dsmLayers)) {
      dispatch(setRightSideCard(WorkspaceRightSideCard.Dataset));
    } else if (!isNil(layers)) {
      layers.forEach((layer) => {
        const workspaceLayer = createWorkspaceLayer({
          layer,
          project: workspace.project,
          site: layer.site,
          iteration: layer.iteration,
        });

        dispatch(addWorkspaceLayer(workspaceLayer));
      });
    }

    if (!isNil(dsmLayers)) {
      dsmLayers.map(({ id, capturedDsmCog, site, name, ...rest }) => {
        const dsmLayer = addCapturedDsmMapLayer(id, capturedDsmCog);
        const workspaceDsmLayer = createDSMLayer(dsmLayer);

        const workspaceLayer = createWorkspaceLayer({
          layer: { ...workspaceDsmLayer, ...rest },
          project: workspace.project,
          site,
          iteration: {
            id,
            name,
          },
        });

        dispatch(addWorkspaceLayer(workspaceLayer));
      });
    }

    cesiumProxy?.flyTo({
      longitude: longitude.toString(),
      latitude: latitude.toString(),
      height,
      heading,
      pitch,
      roll,
    });
  };

  return (
    <div className="map-3d">
      {isUndefined(loggedUser) || isLoadingWorkspaceResponse ? (
        <Spinner />
      ) : (
        <>
          <Map3DSideBar />
          <Map3DContainer />
        </>
      )}
    </div>
  );
};

Map3D.route = '/3d-map';
