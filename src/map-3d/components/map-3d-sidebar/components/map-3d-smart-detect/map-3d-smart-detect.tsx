import React from 'react';
import { Map3DNoAccessToFeature, Map3DNoTerrainSelected } from '../../shared';
import { GenerateSmartDetectForm } from './generate-smart-detect-form';
import { useAppSelector } from 'src/app/hooks';
import { selectMap3dDataset } from 'src/map-3d/shared/map-3d-slices';

export const Map3DSmartDetect: React.FC = () => {
  // Contexts.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  if (!selectedTerrainIteration?.id) {
    return <Map3DNoTerrainSelected />;
  } else if (!selectedTerrainIteration?.canManageIterations) {
    return <Map3DNoAccessToFeature />;
  }

  return <GenerateSmartDetectForm />;
};
