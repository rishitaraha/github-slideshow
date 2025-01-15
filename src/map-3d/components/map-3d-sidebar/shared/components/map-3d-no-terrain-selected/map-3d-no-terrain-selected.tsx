import { Button } from '@aus-platform/design-system';
import React, { HTMLProps, useState } from 'react';
import classname from 'classnames';
import { isEmpty } from 'lodash';
import { SelectTerrainModal } from '../modals/select-terrain-modal';
import { selectMap3dDataset } from 'map-3d/shared/map-3d-slices';
import { useAppSelector } from 'src/app/hooks';

export const Map3DNoTerrainSelected: React.FC<HTMLProps<HTMLDivElement>> = ({
  className,
}) => {
  // States.
  const { selectedProject } = useAppSelector(selectMap3dDataset);
  const [showModals, setShowModals] = useState({
    selectTerrainModal: false,
  });

  // Modal Handlers.
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

  // Constants.
  const customClassName = classname(['map-3d-no-terrain-container', className]);

  return (
    <div className={customClassName}>
      <span className="map-3d-no-terrain-container__text">
        No terrain selected
      </span>
      <Button
        onClick={showSelectTerrainModal}
        disabled={isEmpty(selectedProject?.id)}
      >
        Select Terrain
      </Button>
      {showModals.selectTerrainModal && (
        <SelectTerrainModal onHide={hideSelectTerrainModal} />
      )}
    </div>
  );
};
