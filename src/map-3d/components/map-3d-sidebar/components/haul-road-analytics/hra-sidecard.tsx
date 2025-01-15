import { SideBarCard } from '@aus-platform/design-system';
import { useContext, useState } from 'react';
import { SelectTerrainFooter, SelectTerrainModal } from '../../shared';
import { HaulRoadAnalytics } from './haul-road-analytics';
import { HRATableCard } from './hra-table-card';
import { Map3DSideBarContext } from 'map-3d/contexts';
import {
  selectHRA,
  selectMap3dSidebar,
  setHRATable,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const HRASidecard = () => {
  // Redux.
  const { table } = useAppSelector(selectHRA);
  const dispatch = useAppDispatch();

  // Hooks.
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);

  // Contexts.
  const { hideSidecard } = useContext(Map3DSideBarContext);

  // States.
  const [showSelectTerrainModal, setShowSelectTerrainModal] = useState(false);

  // Handlers.
  const onCloseTableCard = () => {
    dispatch(setHRATable({ ...table, show: false }));
  };

  const hideSelectTerrainModal = () => {
    setShowSelectTerrainModal(false);
  };

  const openSelectTerrainModal = () => {
    setShowSelectTerrainModal(true);
  };

  return (
    <>
      <SideBarCard
        className="aus-sidebar-item__sidecard map-3d-sidebar-card"
        title="Haul Road Analytics"
        show={activeSidebarOption?.isHidden}
        onClose={hideSidecard}
      >
        <HaulRoadAnalytics />
        <SelectTerrainFooter onButtonClick={openSelectTerrainModal} />
        {showSelectTerrainModal && (
          <SelectTerrainModal onHide={hideSelectTerrainModal} />
        )}
      </SideBarCard>
      {table.show && table.haulRoadId && table.haulRoadName && (
        <HRATableCard
          isExpanded={!activeSidebarOption?.isHidden}
          onClose={onCloseTableCard}
          haulRoadId={table.haulRoadId}
          haulRoadName={table.haulRoadName}
        />
      )}
    </>
  );
};
