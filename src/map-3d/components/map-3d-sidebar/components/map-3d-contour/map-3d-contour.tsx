import { IconIdentifier, Spinner } from '@aus-platform/design-system';
import { useEffect, useState } from 'react';
import { selectMap3dDataset } from '../../../../shared/map-3d-slices';
import { GeneratingOutput } from '../../shared/components/map-3d-generating-output';
import { Map3DNoTerrainSelected } from '../../shared/components/map-3d-no-terrain-selected';
import { Map3DSidebarOption } from '../../shared/enums';
import { DSMStatusIndicator, GenerateContourForm } from './components';
import { DsmElevationDataType } from './types';
import { handleResponseErrorMessage, useFileMetadata } from 'shared/api';
import { useAppSelector } from 'app/hooks';
import { extractHistogramXyRange } from 'shared/components';
import { BatchJobStatus } from 'shared/enums';

export const Map3DContour: React.FC = () => {
  // States.
  const [showContourForm, setShowContourForm] = useState<boolean>(true);
  const [dsmElevationData, setDsmElevationData] =
    useState<DsmElevationDataType | null>(null);

  // Hooks.
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);

  // Constants.
  const dsmCogStatus =
    selectedTerrainIteration?.capturedDsmCog?.batchJob.status;

  // APIs.
  const {
    data: metadataResponse,
    isSuccess: isSuccessMetadata,
    isLoading: isLoadingMetadata,
    isError: isErrorMetadata,
    error: metadataError,
  } = useFileMetadata(
    {
      fileId: selectedTerrainIteration?.capturedDsmCog?.id ?? '',
      iterationId: selectedTerrainIteration?.id ?? '',
    },
    dsmCogStatus === BatchJobStatus.Completed,
  );

  // useEffects.
  useEffect(() => {
    if (isLoadingMetadata || !isSuccessMetadata || !metadataResponse) {
      return;
    }

    const { minElevation, maxElevation, statistics } = metadataResponse.data;

    if (minElevation && maxElevation) {
      setDsmElevationData({
        min: Math.round(minElevation),
        max: Math.round(maxElevation),
      });
    } else if (statistics) {
      const { minX, maxX } = extractHistogramXyRange(
        metadataResponse.data?.statistics,
      );
      setDsmElevationData({
        min: Math.round(minX),
        max: Math.round(maxX),
      });
    } else {
      setDsmElevationData(null);
    }
  }, [isLoadingMetadata, isSuccessMetadata, metadataResponse]);

  useEffect(() => {
    handleResponseErrorMessage(isErrorMetadata, metadataError);
  }, [isErrorMetadata, metadataError]);

  // Renders.
  const contourFormRenderer = () => {
    if (!selectedTerrainIteration?.id) {
      return <Map3DNoTerrainSelected />;
    } else if (dsmCogStatus === BatchJobStatus.Failed) {
      return (
        <DSMStatusIndicator
          iconIdentifier={IconIdentifier.Warning}
          title="DSM Processing Failed"
          description="Reupload the DSM and try again"
        />
      );
    } else if (dsmCogStatus !== BatchJobStatus.Completed) {
      return (
        <DSMStatusIndicator
          iconIdentifier={IconIdentifier.InfoCircle}
          title="DSM Processing"
          description="You’ll be able to generate Contour after DSM has processed successfully"
        />
      );
    } else if (showContourForm && isSuccessMetadata && dsmElevationData) {
      return (
        <GenerateContourForm
          setShowContourForm={setShowContourForm}
          dsmElevationBounds={dsmElevationData}
        />
      );
    } else if (!showContourForm) {
      return (
        <GeneratingOutput
          setShowCurrentForm={setShowContourForm}
          currentAnalyticsOption={Map3DSidebarOption.Contour}
        />
      );
    }
  };

  return (
    <div className="map-3d-contour map-3d-sidebar-content">
      {isLoadingMetadata ? <Spinner /> : contourFormRenderer()}
    </div>
  );
};
