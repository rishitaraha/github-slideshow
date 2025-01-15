import { CesiumViewer } from '@aus-platform/cesium';
import { Fab, IconIdentifier } from '@aus-platform/design-system';
import { SceneMode } from 'cesium';
import classNames from 'classnames';
import { isNil, partition } from 'lodash';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  WorkspaceRightSideCard,
  resetDataset,
  resetMap3DWorkspace,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dSidebar,
  selectMap3dWorkspace,
  setCesiumProxy,
} from '../../shared/map-3d-slices';
import { Map3DSidebarOption, getLayerBounds } from '../map-3d-sidebar';
import Map3DFooter from './map-3d-footer';
import { FeatureInfo, SearchBar } from './map-3d-tools';
import { Map3dMeasurementTool } from './map-3d-tools/map-3d-measurement-tool';
import { ShareableLinkModal } from './modals/shareable-link-modal';
import { PrintWrapper } from './print-wrapper';
import { SceneModeSwitcher } from './scene-mode-switcher';
import { ShareableLinkButton } from './shareable-link';
import { ViewportCaptureButton } from './viewport-capture';
import { CustomDate } from 'src/shared/utils';
import { RoutesEnum } from 'src/shared/routes';
import { LayerType } from 'src/shared/api';
import { EnvVariables } from 'shared/env-variables';
import { MapNavigationControls } from 'shared/components';
import {
  CesiumProxy,
  baseMapImageryProvider,
  defaultCesiumViewerOptions,
} from 'shared/cesium';
import {
  ShareableWorkspacePayload,
  useAddWorkspace,
} from 'shared/api/workspace';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const Map3DContainer = () => {
  // Dispatch.
  const dispatch = useAppDispatch();

  // Selectors.
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);
  const { rightSideCard } = useAppSelector(selectMap3dWorkspace);
  const { currentSceneMode } = useAppSelector(selectMap3DState);
  const {
    selectedProject,
    selectedTerrainIteration,
    activeWorkspaceIteration,
  } = useAppSelector(selectMap3dDataset);
  const { workspaceLayers } = useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // Constants.
  const currentTime = new CustomDate(Date.now()).formatDateTime();
  const reportTitle = 'drone_survey_map_' + currentTime;
  const { origin } = window.location;
  const prefixLink = `${origin}${RoutesEnum.Map3D}/`;

  const layerBounds = useMemo(
    () => getLayerBounds(workspaceLayers),
    [workspaceLayers],
  );

  const getAddWorkspacePayload = () => {
    const camera = cesiumProxy?.cesiumViewer.viewer?.camera;

    if (!selectedProject || !camera) {
      return;
    }

    const { roll, heading, pitch, positionCartographic } = camera;

    const { longitude, latitude, height } = positionCartographic ?? {};
    const [dsmLayerList, workspaceLayerList] = partition(
      workspaceLayers,
      (layer) => layer.type === LayerType.CapturedDsm,
    );

    const dsmLayerListPayload = dsmLayerList.map(
      ({ id: dsmIterationId, zIndex, show }) => ({
        dsmIterationId,
        zIndex: zIndex ?? 0,
        show: show ?? false,
      }),
    );

    const workspaceLayerListPayload = workspaceLayerList?.map(
      ({ id, zIndex, show }) => ({
        id,
        show: show ?? false,
        zIndex: zIndex ?? 0,
      }),
    );

    const payload: ShareableWorkspacePayload = {
      projectId: selectedProject.id,
      camera: {
        latitude: Number(latitude.toFixed(8)),
        longitude: Number(longitude.toFixed(8)),
        height,
        heading,
        pitch,
        roll,
      },
      terrainIterationId: selectedTerrainIteration?.id,
      selectedIterationId: activeWorkspaceIteration?.id,
      layers: [...workspaceLayerListPayload, ...dsmLayerListPayload],
    };

    return payload;
  };

  // Refs.
  const cesiumContainerRef = useRef<HTMLDivElement>(null);
  const printElementRef = useRef<HTMLDivElement>(null);

  // Hooks.
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const handlePrint = useReactToPrint({
    documentTitle: reportTitle,
    content: () => printElementRef.current,
  });

  // States.
  const [isUIHidden, setIsUIHidden] = useState(false);
  const [showShareableLinkModal, setShowShareableLinkModal] = useState(false);
  const [isShareableLinkCopied, setIsShareableLinkCopied] = useState(false);
  const [shareableWorkspaceState, setShareableWorkspaceState] =
    useState<ShareableWorkspacePayload | null>(null);

  // Apis.
  const {
    mutate: sendAddWorkspaceRequest,
    data: addWorkspaceResponse,
    isPending: isLoadingAddWorkspace,
    isSuccess: isSuccessAddWorkspace,
  } = useAddWorkspace();

  // useEffect - Mount.
  useEffect(() => {
    if (cesiumContainerRef.current) {
      const viewer = new CesiumViewer(
        cesiumContainerRef.current,
        EnvVariables.cesiumAccessToken,
        {
          ...defaultCesiumViewerOptions,
          // Ref: https://stackoverflow.com/questions/54985128/print-or-export-cesium-map-loading-division
          contextOptions: {
            webgl: { preserveDrawingBuffer: true },
          },
          vrButton: EnvVariables.environment == 'development',
        },
      );

      // Adding satellite imagery layer.
      viewer.viewer?.imageryLayers.addImageryProvider(
        baseMapImageryProvider,
        0,
      );

      const newCesiumProxy = new CesiumProxy(viewer);
      dispatch(setCesiumProxy(newCesiumProxy));
    }

    return () => {
      dispatch(resetDataset());
      dispatch(resetMap3DWorkspace());
    };
  }, []);

  useEffect(() => {
    if (isSuccessAddWorkspace && addWorkspaceResponse.slug) {
      onCopyShareableLink(`${prefixLink}${addWorkspaceResponse.slug}`);
    }
  }, [isSuccessAddWorkspace]);

  // Change URL when loaded workspace state changes.
  useEffect(() => {
    const payload = getAddWorkspacePayload();
    const hasWorkspaceChanged =
      JSON.stringify(shareableWorkspaceState) !== JSON.stringify(payload);

    if (hasWorkspaceChanged && workspaceId) {
      navigate(`${RoutesEnum.Map3D}/${workspaceId}`, { replace: true });
    }
  }, [shareableWorkspaceState]);

  // Conditional variables.
  const isLeftSideCardOpen = Boolean(
    !isNil(activeSidebarOption) &&
      activeSidebarOption.isHidden &&
      activeSidebarOption?.cardProps?.title !== Map3DSidebarOption.BaseMap,
  );

  const isRightSideCardOpen = rightSideCard !== WorkspaceRightSideCard.None;

  // Custom className.
  const customContainerClass = classNames([
    'map-3d-container',
    {
      'map-3d-container--2d-mode': currentSceneMode === SceneMode.SCENE2D,
      'shift-by-sidecard': isRightSideCardOpen,
    },
  ]);

  const customToolContainerClass = classNames([
    'map-3d-container__tools',
    isLeftSideCardOpen ? 'move-position' : '',
  ]);

  // Handlers.
  const onCopyShareableLink = async (linkId: string) => {
    await navigator.clipboard.writeText(linkId);
    setIsShareableLinkCopied(true);

    setTimeout(() => setIsShareableLinkCopied(false), 2000);
  };

  const onClickShareableLink = () => {
    setShowShareableLinkModal(!showShareableLinkModal);
    const payload = getAddWorkspacePayload();

    if (showShareableLinkModal || !payload) {
      return;
    }

    setShareableWorkspaceState(payload);

    const hasWorkspaceChanged =
      JSON.stringify(shareableWorkspaceState) !== JSON.stringify(payload);

    if (hasWorkspaceChanged) {
      sendAddWorkspaceRequest(payload);
    } else {
      onCopyShareableLink(`${prefixLink}${addWorkspaceResponse?.slug}`);
    }
  };

  const hideShareableLinkModal = () => {
    setShowShareableLinkModal(
      (showShareableLinkModal) => !showShareableLinkModal,
    );
  };

  // Note: This is a hack to enable VR mode in dev.
  const onHideUIButtonClick = () => {
    setIsUIHidden(!isUIHidden);

    const headerElement = document.getElementsByClassName(
      'header',
    )[0] as HTMLElement;
    const navigationDivElement = document.getElementById(
      'navigationDiv',
    ) as HTMLElement;
    const performanceDisplayElement = document.getElementsByClassName(
      'cesium-performanceDisplay-defaultContainer',
    )[0] as HTMLElement;
    const transitionsContainerElement = document.getElementsByClassName(
      'tsqd-transitions-container',
    )[0] as HTMLElement;

    if (!isUIHidden) {
      // Hide elements
      headerElement.style.display = 'none';
      navigationDivElement.style.display = 'none';
      performanceDisplayElement.style.display = 'none';
      transitionsContainerElement.style.display = 'none';
    } else {
      // Unhide elements
      headerElement.style.display = 'flex';
      navigationDivElement.style.display = 'unset';
      performanceDisplayElement.style.display = 'unset';
      transitionsContainerElement.style.display = 'unset';
    }
  };

  return (
    <PrintWrapper reportTitle={'Drone Survey Map'} ref={printElementRef}>
      <div className={customContainerClass}>
        <div
          className="cesium-viewer-container"
          ref={cesiumContainerRef}
          style={{
            position: isUIHidden ? 'fixed' : undefined,
            zIndex: isUIHidden ? 20000 : undefined,
          }}
        />

        {/* Tools */}
        <div className={customToolContainerClass}>
          <Map3dMeasurementTool />
          <FeatureInfo />
          <SearchBar />
          <SceneModeSwitcher isLeftSidecardOpen={isLeftSideCardOpen} />

          {/* Hide UI */}
          {EnvVariables.environment == 'development' && (
            <Fab
              leftIconIdentifier={
                isUIHidden
                  ? IconIdentifier.VisibilityOn
                  : IconIdentifier.VisibilityOff
              }
              onClick={onHideUIButtonClick}
              className="map-3d-container__tools__hide-ui-btn"
            />
          )}
        </div>
        <div className="map-3d-print-warning">
          Scale is displayed only in 2D map view
        </div>
        <ShareableLinkButton onClickShareableLink={onClickShareableLink} />
        <ViewportCaptureButton handlePrint={handlePrint} />
        <MapNavigationControls cesiumProxy={cesiumProxy} bounds={layerBounds} />
        <Map3DFooter />

        {/* Modals */}
        {showShareableLinkModal && (
          <ShareableLinkModal
            onHide={hideShareableLinkModal}
            show={showShareableLinkModal}
            isShareableLinkCopied={isShareableLinkCopied}
            onCopyShareableLink={onCopyShareableLink}
            isLoadingAddWorkspace={isLoadingAddWorkspace}
            slug={addWorkspaceResponse?.slug}
          />
        )}
      </div>
    </PrintWrapper>
  );
};
