import { isNil } from 'lodash';
import { useState } from 'react';
import { Map3DNoTerrainSelected } from '../../../shared';
import { HaulRoadDetails } from './haul-road-details/haul-road-details';
import { HaulRoadList } from './haul-road-list/haul-road-list';
import { useAppSelector } from 'src/app/hooks';
import { selectMap3dDataset } from 'src/map-3d/shared/map-3d-slices';
import { HaulRoadListItem } from 'src/shared/api';

export const HRAOutputs = ({ activeTabKey }) => {
  // States.
  const [selectedHaulRoad, setSelectedHaulRoad] =
    useState<HaulRoadListItem | null>(null);

  // Selectors.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  // Handlers.
  const onClickHaulRoadHandler = (haulRoad: HaulRoadListItem) => {
    setSelectedHaulRoad(haulRoad);
  };

  const onClickBackButton = () => {
    setSelectedHaulRoad(null);
  };

  return (
    <div className="hra-sidecard-tab-content">
      {!selectedTerrainIteration?.id ? (
        <Map3DNoTerrainSelected className="map-3d-sidebar-content" />
      ) : isNil(selectedHaulRoad) ? (
        <HaulRoadList
          onClickHaulRoad={onClickHaulRoadHandler}
          iteration={selectedTerrainIteration}
          activeTabKey={activeTabKey}
        />
      ) : (
        <HaulRoadDetails
          haulRoadId={selectedHaulRoad.id}
          onClickBackButton={onClickBackButton}
        />
      )}
    </div>
  );
};
