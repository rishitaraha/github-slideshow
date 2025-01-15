import { useState } from 'react';
import { useAppSelector } from '../../../../../app/hooks';
import { selectMap3dDataset } from '../../../../shared/map-3d-slices';
import { GeneratingOutput, Map3DNoTerrainSelected } from '../../shared';
import { Map3DSidebarOption } from '../../shared/enums';
import { Map3DNoAccessToFeature } from '../../shared/components/map-3d-no-access-to-feature';
import { GenerateRoadAnalytics } from './generate-analytics-form';

export const Map3DRoadAnalytics: React.FC = () => {
  // States.
  const [showRoadAnalyticsForm, setShowRoadAnalyticsForm] = useState(true);

  // Hooks.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  // Renders.
  const renderGenerateAnalytics = () => {
    if (!selectedTerrainIteration?.id) {
      return <Map3DNoTerrainSelected />;
    } else if (!selectedTerrainIteration?.canManageIterations) {
      return <Map3DNoAccessToFeature />;
    } else if (!showRoadAnalyticsForm) {
      return (
        <GeneratingOutput
          setShowCurrentForm={setShowRoadAnalyticsForm}
          currentAnalyticsOption={Map3DSidebarOption.GenerateAnalytics}
          text="Request for Analytics Submitted"
          subtext="Submit New Request for Analytics"
          linkText="Once ready, you can load the layers in workspace"
          showWorkspaceBtn={false}
        />
      );
    }

    return (
      <GenerateRoadAnalytics setShowAnalyticsForm={setShowRoadAnalyticsForm} />
    );
  };

  return (
    <div className="generate-road-analytics">{renderGenerateAnalytics()}</div>
  );
};
