import { TabSwitcher } from '@aus-platform/design-system';
import { useState } from 'react';
import { Map3DNoTerrainSelected } from '../../shared';
import { haulRoadAnalyticsTabs } from './enums';
import { HaulRoadAnalyticsTabs } from './haul-road-analytics-tabs';
import { selectMap3dDataset } from 'src/map-3d/shared/map-3d-slices';
import { useAppSelector } from 'src/app/hooks';

export const HaulRoadAnalytics = () => {
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  const [activeTabKey, setActiveTabKey] = useState(
    haulRoadAnalyticsTabs.Outputs,
  );

  const onTabSwitch = (tabKey) => {
    setActiveTabKey(tabKey);
  };

  return (
    <div className="haul-road-analytics__container">
      {!selectedTerrainIteration?.id ? (
        <Map3DNoTerrainSelected className="map-3d-sidebar-content" />
      ) : (
        <TabSwitcher
          tabComponentList={HaulRoadAnalyticsTabs({
            activeTabKey,
            setActiveTabKey,
          })}
          activeKey={activeTabKey}
          onTabSwitch={(tabKey) => onTabSwitch(tabKey)}
        />
      )}
    </div>
  );
};
