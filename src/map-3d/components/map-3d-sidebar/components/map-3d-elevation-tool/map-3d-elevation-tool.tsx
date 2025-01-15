import { SideBarCard } from '@aus-platform/design-system';
import { useContext, useEffect, useState } from 'react';
import { selectMap3dSidebar } from '../../../../shared/map-3d-slices';
import { SelectTerrainModal } from '../../shared/components/modals/select-terrain-modal';
import { SelectTerrainFooter } from '../../shared/components/select-terrain-footer';
import { ElevationProfileCard } from './elevation-profile-card';
import { ElevationToolSideCard } from './elevation-tool-sidecard';
import { LineRepresentation, Map3dElevationProfileState } from '.';
import { useAppSelector } from 'app/hooks';
import { useOnFirstMount } from 'shared/hooks';
import { Map3DSideBarContext } from 'map-3d/contexts';

const elevationProfileInitialState: Map3dElevationProfileState = {
  showElevationProfileModal: false,
  isElevationProfileModalEmpty: true,
  isElevationProfileModalLoading: false,
  expandElevationProfileModal: false,
  elevationProfileChartData: null,
  elevationProfileError: null,
};

export const Map3DElevationTool = () => {
  // States.
  const [showSelectTerrainModal, setShowSelectTerrainModal] = useState(false);
  const [elevationProfile, setElevationProfile] = useState(
    elevationProfileInitialState,
  );
  const [lineCoordinates, setLineCoordinates] = useState<LineRepresentation>();
  const [iterationIds, setIterationIds] = useState<string[]>([]);

  // Hooks.
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);
  const isFirstRender = useOnFirstMount();

  // Contexts.
  const { hideSidecard } = useContext(Map3DSideBarContext);

  // useEffect.
  useEffect(() => {
    if (!isFirstRender) {
      expandElevationModalHandler(
        !elevationProfile.expandElevationProfileModal,
      );
    }
  }, [activeSidebarOption?.isHidden]);

  // Handlers.
  const expandElevationModalHandler = (expandModalState: boolean) => {
    setElevationProfile({
      ...elevationProfile,
      expandElevationProfileModal: expandModalState,
    });
  };

  // Modal Handlers.
  const openSelectTerrainModal = () => {
    setShowSelectTerrainModal(true);
  };

  const hideSelectTerrainModal = () => {
    setShowSelectTerrainModal(false);
  };

  return (
    <div>
      <SideBarCard
        className="aus-sidebar-item__sidecard map-3d-sidebar-card"
        title="Elevation Profile"
        show={activeSidebarOption?.isHidden}
        onClose={hideSidecard}
      >
        <ElevationToolSideCard
          elevationProfile={elevationProfile}
          setElevationProfile={setElevationProfile}
          setIterationIds={setIterationIds}
          setLineCoordinates={setLineCoordinates}
        />
        <SelectTerrainFooter onButtonClick={openSelectTerrainModal} />
      </SideBarCard>

      <ElevationProfileCard
        elevationProfile={elevationProfile}
        iterationIds={iterationIds}
        lineCoordinates={lineCoordinates}
        onClose={() =>
          setElevationProfile({
            ...elevationProfile,
            showElevationProfileModal: false,
          })
        }
      />
      {/* TODO: Move to Sidebar component after refactoring sidebar component */}
      {showSelectTerrainModal && (
        <SelectTerrainModal onHide={hideSelectTerrainModal} />
      )}
    </div>
  );
};
