import {
  IconIdentifier,
  Placement,
  SideBar,
  SideBarItem,
  SideBarOption,
  SideCardType,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil, isUndefined } from 'lodash';
import React, { useContext, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { GlobalContext } from '../../../shared/context';
import { Map3DSideBarContext } from '../../contexts';
import {
  resetElevationTool,
  resetMap3DHeap,
  resetMap3DSidebar,
  resetMap3DWorkspace,
  selectMap3dHeap,
  selectMap3dSidebar,
  selectMap3dWorkspace,
  setActiveSidebarOption,
  setCurrentEditableLayerId,
  setShowUnsavedFeaturesModal,
} from '../../shared/map-3d-slices';
import { map3dSidebarFeatureFlags, map3dSidebarItems } from './constants';

import { HeapMarkArea } from './components/map-3d-heap-management/components/volume-calculation/enums';
import { SelectTerrainModal } from './shared/components/modals/select-terrain-modal';
import { SelectTerrainFooter } from './shared/components/select-terrain-footer';
import { Map3DSidebarOption } from './shared/enums';

export const Map3DSideBar: React.FC = () => {
  // States
  const [showModals, setShowModals] = useState({
    selectTerrainModal: false,
  });

  // Selectors.
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);
  const { currentEditableLayerId, drawingTools, actionTools } =
    useAppSelector(selectMap3dWorkspace);

  const { polygonTool: heapPolygonTool } = useAppSelector(selectMap3dHeap);

  // Hooks.
  const dispatch = useAppDispatch();
  const { loggedUser } = useContext(GlobalContext);

  // useEffects.
  useEffect(() => {
    return () => {
      // Cleanup of redux states.
      dispatch(resetMap3DWorkspace());
      dispatch(resetMap3DHeap());
      dispatch(resetMap3DSidebar());
      dispatch(resetElevationTool());
    };
  }, []);

  // Handlers.
  const hideSidecard = () => {
    if (activeSidebarOption) {
      dispatch(
        setActiveSidebarOption({
          ...activeSidebarOption,
          isHidden: !activeSidebarOption.isHidden,
        }),
      );
    }
  };

  //Modal Handlers
  const showSelectTerrainModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      selectTerrainModal: true,
    }));

  const hideSelectTerrainModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      selectTerrainModal: false,
    }));

  const activeOptionHandler = (
    option: SideBarOption,
    identifier: IconIdentifier,
  ) => {
    const isActiveOptionSelected =
      identifier === activeSidebarOption?.icon.identifier;

    // When sidecard is already open but other option is clicked.
    if (!isActiveOptionSelected) {
      // Handle unsaved heap polygons.
      const drawnHeapPolygons =
        heapPolygonTool?.getPolygonByProperty(
          'heapMarkArea',
          HeapMarkArea.Draw,
        ) ?? [];

      if (
        drawnHeapPolygons.length > 0 &&
        option.cardProps.title !== Map3DSidebarOption.VolumeCalculation
      ) {
        dispatch(setShowUnsavedFeaturesModal(true));
        return;
      }

      // Handle unsaved features.
      if (
        drawingTools?.checkUnsavedFeatures() &&
        activeSidebarOption?.icon.identifier !== IconIdentifier.Contour &&
        activeSidebarOption?.icon.identifier !== IconIdentifier.RoadAnalytics
      ) {
        actionTools?.selectFeatureTool.deselectSelectedFeatures();
        dispatch(setShowUnsavedFeaturesModal(true));
        return;
      }

      // Updating the default selected option for current activeOption.
      dispatch(
        setActiveSidebarOption({
          ...option,
          cardProps: {
            ...option.cardProps,
            onClose: hideSidecard,
            show: true,
          },
          isHidden: true,
        }),
      );
      drawingTools?.resetStyles();

      // Get out of editing mode when switching sidebar options.
      if (
        currentEditableLayerId &&
        option.cardProps.title !== Map3DSidebarOption.Workspace
      ) {
        actionTools?.selectFeatureTool.deselectSelectedFeatures();
        dispatch(setCurrentEditableLayerId(null));
      }
    } else {
      hideSidecard();
    }
  };

  // Renders.
  const renderSideCard = () => {
    // Don't render sidebarcard initially.
    if (!isNil(activeSidebarOption) && activeSidebarOption.cardProps) {
      // Return component directly if SideCardType is Custom or is not a part of Sidecard.
      if (
        activeSidebarOption?.isOutsideSidecard ||
        activeSidebarOption.sidecardType === SideCardType.Custom
      ) {
        return activeSidebarOption.cardProps.component;
      }

      return (
        <>
          <SideBarItem.Card
            title={activeSidebarOption.cardProps.title}
            show={!isNil(activeSidebarOption) && activeSidebarOption.isHidden}
            onClose={hideSidecard}
            className="map-3d-sidebar-card"
          >
            {activeSidebarOption.cardProps.component}
            <SelectTerrainFooter onButtonClick={showSelectTerrainModal} />
            {showModals.selectTerrainModal && (
              <SelectTerrainModal onHide={hideSelectTerrainModal} />
            )}
          </SideBarItem.Card>
        </>
      );
    }
  };

  return (
    <Map3DSideBarContext.Provider
      value={{
        activeOptionHandler,
        hideSidecard,
      }}
    >
      <>
        <SideBar className="map-3d-sidebar">
          {map3dSidebarItems.map(
            (sidebarItem: SideBarOption, index: number) => {
              // Checking feature flags for side bar items.
              const featureFlagForOption =
                // TODO: Remove type cast after updating the type of title in design system.
                map3dSidebarFeatureFlags[
                  sidebarItem.cardProps.title as Map3DSidebarOption
                ];

              if (
                featureFlagForOption &&
                loggedUser &&
                !loggedUser.featureFlags[featureFlagForOption]
              ) {
                return;
              }

              return (
                <SideBarItem key={index}>
                  <Tooltip
                    hoverText={sidebarItem.icon.toolTipText}
                    placement={Placement.Right}
                  >
                    <SideBarItem.Icon
                      identifier={sidebarItem.icon.identifier}
                      isActive={
                        !isNil(activeSidebarOption) &&
                        sidebarItem.icon === activeSidebarOption.icon
                      }
                      isHidden={
                        !isNil(activeSidebarOption) &&
                        !isUndefined(activeSidebarOption.isHidden) &&
                        activeSidebarOption.isHidden
                      }
                      onClick={() =>
                        activeOptionHandler(
                          sidebarItem,
                          sidebarItem.icon.identifier,
                        )
                      }
                      data-testid={`sidebar-${sidebarItem.icon.identifier}-icon`}
                    />
                  </Tooltip>
                </SideBarItem>
              );
            },
          )}
        </SideBar>
        {renderSideCard()}
      </>
    </Map3DSideBarContext.Provider>
  );
};
