import {
  Icon,
  IconIdentifier,
  Input,
  SelectOption,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames';
import { SwipeMap3DMeasurementTool } from './swipe-map-3d-measurement-tool';
import { SwipeMap3dSidecard } from './swipe-map-3d-sidecard';
import {
  resetDataset,
  selectSwipeMap3D,
  setIsLeftSidecardOpen,
  setIsRightSidecardOpen,
  setSelectedSite,
  setSplitViewer,
} from './swipe-map-3d-slice';
import { SwipeMap3dLayerPropertiesSidecard } from './swipe-map-3d-layer-properties-sidecard';
import { SwipeMap3DBaseLayer } from './swipe-map-3d-base-layers';
import { resetSwipeMap } from './helpers';
import { useProjectList, useSiteList } from 'shared/api';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  CesiumSplitViewerProxy,
  defaultCesiumViewerOptions,
} from 'shared/cesium';
import { EnvVariables } from 'shared/env-variables';
import { MapNavigationControls } from 'shared/components';

export const SwipeMap3D = () => {
  // Dispatches.
  const dispatch = useAppDispatch();

  // Selectors.
  const {
    isLeftSidecardOpen,
    isRightSidecardOpen,
    selectedSite,
    splitViewer,
    layersBoundingBox,
    leftPropertyLayerId,
    rightPropertyLayerId,
    leftLayerList,
    rightLayerList,
  } = useAppSelector(selectSwipeMap3D);

  // Refs.
  const cesiumContainerLeft = useRef<HTMLDivElement>(null);
  const cesiumContainerRight = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);

  // States.
  const [projectSelectOptionList, setProjectSelectOptionList] =
    useState<SelectOption<string>[]>();
  const [selectedProjectOption, setSelectedProjectOption] =
    useState<SelectOption<string>>();

  const [siteSelectOptionList, setSiteSelectOptionList] =
    useState<SelectOption<string>[]>();

  const [showLeftLayerPropertySidecard, setShowLeftLayerPropertySidecard] =
    useState(false);
  const [showRightLayerPropertySidecard, setShowRightLayerPropertySidecard] =
    useState(false);

  // Constants.
  const selectedSiteOption: SelectOption<string> | null = selectedSite
    ? {
        label: selectedSite.name,
        value: selectedSite.id,
      }
    : null;

  const navigationControlClassname = classNames({
    'move-by-right-sidecard': isRightSidecardOpen,
  });

  const containerClassname = classNames('swipe-map-3d-container', {
    'move-by-right-sidecard': isRightSidecardOpen,
  });

  // Apis.
  const {
    data: projectListResponse,
    isSuccess: isSuccessProjectList,
    refetch: refetchProjectList,
    isFetching: isFetchingProjectList,
  } = useProjectList({
    enabled: false,
  });

  const {
    data: siteListResponse,
    isSuccess: isSuccessSiteList,
    isFetching: isFetchingSiteList,
  } = useSiteList(
    {
      projectId: selectedProjectOption?.value,
    },
    !isNil(selectedProjectOption),
  );

  // Handlers.
  const resetAll = () => {
    // Reset Cesium Viewer.
    resetSwipeMap(leftLayerList, splitViewer, true);
    resetSwipeMap(rightLayerList, splitViewer, false);

    // Reset Redux States.
    dispatch(resetDataset());
  };

  const onFocusSelectProject = () => {
    if (isEmpty(projectSelectOptionList)) {
      refetchProjectList();
    }
  };

  const onChangeProject = (selectedOption: SelectOption<string>) => {
    if (selectedOption.value !== selectedProjectOption?.value) {
      setSelectedProjectOption(selectedOption);
      resetAll();
    }
  };

  const onChangeSite = (selectedOption: SelectOption<string>) => {
    if (selectedOption.value !== selectedSite?.id) {
      resetAll();
      dispatch(setIsLeftSidecardOpen(true));
      dispatch(setIsRightSidecardOpen(true));
      dispatch(
        setSelectedSite({
          name: selectedOption.label,
          id: selectedOption.value,
        }),
      );
    }
  };

  const onToggleLeftSidecard = () => {
    dispatch(setIsLeftSidecardOpen(!isLeftSidecardOpen));
  };

  const onToggleRightSidecard = () => {
    dispatch(setIsRightSidecardOpen(!isRightSidecardOpen));
  };

  const openLayerPropertySidecard = (isLayerFromLeftSidecard: boolean) => {
    if (isLayerFromLeftSidecard) {
      setShowLeftLayerPropertySidecard(true);
    } else {
      setShowRightLayerPropertySidecard(true);
    }
  };

  const onCloseLeftLayerPropertiesSidecard = () => {
    setShowLeftLayerPropertySidecard(false);
  };

  const onCloseRightLayerPropertiesSidecard = () => {
    setShowRightLayerPropertySidecard(false);
  };

  // useEffects.
  useEffect(() => {
    if (
      cesiumContainerLeft.current &&
      cesiumContainerRight.current &&
      sliderRef.current
    ) {
      const splitViewerInstance = new CesiumSplitViewerProxy({
        cesiumContainerLeft: cesiumContainerLeft.current,
        cesiumContainerRight: cesiumContainerRight.current,
        slider: sliderRef.current,
        token: EnvVariables.cesiumAccessToken,
        optionsLeft: defaultCesiumViewerOptions,
        optionsRight: defaultCesiumViewerOptions,
      });

      dispatch(setSplitViewer(splitViewerInstance));
    }

    return () => {
      resetAll();
    };
  }, []);

  useEffect(() => {
    if (isSuccessProjectList && !isNil(projectListResponse)) {
      const projectList: SelectOption<string>[] | undefined =
        projectListResponse.data.projects.map(({ name, id }) => {
          return {
            label: name,
            value: id,
          };
        });

      setProjectSelectOptionList(projectList);
    }
  }, [isSuccessProjectList, projectListResponse]);

  useEffect(() => {
    if (isSuccessSiteList && !isNil(siteListResponse)) {
      const siteList: SelectOption<string>[] | undefined =
        siteListResponse.list.map(({ name, id }) => {
          return {
            label: name,
            value: id,
          };
        });

      setSiteSelectOptionList(siteList);
    }
  }, [isSuccessSiteList, siteListResponse]);

  return (
    <div className={containerClassname}>
      <div className="swipe-map-3d__dataset">
        <Input.Select
          placeholder="Select Project"
          className="swipe-map-3d__dataset__dropdown"
          value={selectedProjectOption}
          isLoading={isFetchingProjectList}
          options={projectSelectOptionList}
          onChange={onChangeProject}
          onFocus={onFocusSelectProject}
        />
        <Input.Select
          className="swipe-map-3d__dataset__dropdown"
          placeholder="Select Site"
          options={siteSelectOptionList}
          value={selectedSiteOption}
          onChange={onChangeSite}
          isLoading={isFetchingSiteList}
        />
      </div>
      <MapNavigationControls
        cesiumProxy={splitViewer}
        className={navigationControlClassname}
        bounds={layersBoundingBox}
      />
      <SwipeMap3DMeasurementTool />
      <div
        className="swipe-map-3d-container--left"
        ref={cesiumContainerLeft}
      ></div>
      <div className="swipe-map-3d__slider" ref={sliderRef}>
        <Icon
          identifier={IconIdentifier.SwipeMapSlider}
          className="swipe-map-3d__slider-icon"
          size={29}
        />
      </div>
      <div
        className="swipe-map-3d-container--right"
        ref={cesiumContainerRight}
      ></div>
      {selectedSiteOption && (
        <>
          <SwipeMap3dSidecard
            isLeftSidecard={true}
            onClickToggleSidecardButton={onToggleLeftSidecard}
            show={isLeftSidecardOpen}
            openLayerPropertySidecard={openLayerPropertySidecard}
            isLayerPropertySidecardOpened={showLeftLayerPropertySidecard}
          />
          <SwipeMap3dSidecard
            isLeftSidecard={false}
            onClickToggleSidecardButton={onToggleRightSidecard}
            show={isRightSidecardOpen}
            openLayerPropertySidecard={openLayerPropertySidecard}
            isLayerPropertySidecardOpened={showRightLayerPropertySidecard}
          />
        </>
      )}

      {<SwipeMap3DBaseLayer />}

      {/* Layer Info Sidecard */}
      {leftPropertyLayerId && (
        <SwipeMap3dLayerPropertiesSidecard
          isLeftLayerPropertySidecard={true}
          show={showLeftLayerPropertySidecard}
          onClose={onCloseLeftLayerPropertiesSidecard}
          project={selectedProjectOption?.label}
          site={selectedSite?.name}
        />
      )}
      {rightPropertyLayerId && (
        <SwipeMap3dLayerPropertiesSidecard
          isLeftLayerPropertySidecard={false}
          show={showRightLayerPropertySidecard}
          onClose={onCloseRightLayerPropertiesSidecard}
          project={selectedProjectOption?.label}
          site={selectedSite?.name}
        />
      )}
    </div>
  );
};
