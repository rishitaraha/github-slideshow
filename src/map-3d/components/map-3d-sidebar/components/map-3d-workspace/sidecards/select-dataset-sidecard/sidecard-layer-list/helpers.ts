import { StatusIndicatorLevel, toast } from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { IterationListItem, SiteListItem } from 'shared/api';
import { CesiumProxy } from 'shared/cesium';
import { SelectLayerListItem } from 'map-3d/components/map-3d-sidebar/shared';
import { BatchJobStatus } from 'shared/enums';

export const zoomToSite = (
  cesiumProxy: CesiumProxy | null,
  site: SiteListItem | null,
) => {
  if (!isNil(site)) {
    const latitude = site?.latitude.toString();
    const longitude = site?.longitude.toString();
    cesiumProxy?.flyTo({ longitude, latitude, height: 1000 });
  }
};

export const handleOrthoTerrainProcessingMessages = (
  iteration: IterationListItem,
  orthoLayer: SelectLayerListItem,
) => {
  // Define the messages for different statuses.
  const messages = {
    noOrthoAndTerrainPresent: `Iteration - ${iteration.name} does not have Orthomosaic & Terrain. Cannot be added to workspace automatically`,
    orthoAndTerrainFailed:
      'Orthomosaic & Terrain have errors & cannot be added to workspace automatically',
    orthoAndTerrainProcessing:
      'Orthomosaic & Terrain are processing & cannot be added to workspace automatically',
    orthoNotPresent: `Iteration - ${iteration.name} does not have Orthomosaic & cannot be added to workspace automatically`,
    orthoHasErrors:
      'Orthomosaic has errors & cannot be added to workspace automatically',
    orthoIsProcessing:
      'Orthomosaic is processing & cannot be added to workspace automatically',
    terrainNotPresent: `Iteration - ${iteration.name} does not have Terrain & cannot be selected automatically`,
    terrainHasFailed: 'Terrain has errors & cannot be selected automatically',
    terrainIsProcessing:
      'Terrain is processing & cannot be selected automatically',
    orthoAndTerrainArePresent:
      'Orthomosaic(s) & Terrain added to workspace automatically',
    onlyOrthoIsPresent: 'Orthomosaic(s) added to workspace automatically',
    onlyTerrainIsPresent: 'Terrain selected automatically',
  };

  // Check if DSM is present.
  const isDSMPresent =
    iteration?.capturedDsm?.status === StatusIndicatorLevel.Done;
  const terrainStatus = iteration?.terrainTiles?.status;

  // Check processing statuses of terrain.
  const isTerrainCompleted =
    terrainStatus === BatchJobStatus.Completed && isDSMPresent;
  const isTerrainProcessing =
    isDSMPresent &&
    (terrainStatus === BatchJobStatus.Started ||
      terrainStatus === BatchJobStatus.Processing);
  const isTerrainError = terrainStatus === BatchJobStatus.Failed;

  // Check processing statuses of ortho.
  const isOrthoDone = orthoLayer?.layerStatus === StatusIndicatorLevel.Done;
  const isOrthoProcessing =
    orthoLayer?.layerStatus === StatusIndicatorLevel.Started ||
    orthoLayer?.layerStatus === StatusIndicatorLevel.Processing;
  const isOrthoError =
    (!isNil(orthoLayer) && isNil(orthoLayer.layerStatus)) ||
    orthoLayer?.layerStatus === StatusIndicatorLevel.Failed;

  // Handling combined status of ortho and terrain.
  if (isNil(orthoLayer) && isNil(terrainStatus)) {
    toast.error(messages.noOrthoAndTerrainPresent);
    return;
  }
  if (isOrthoError && isTerrainError) {
    toast.error(messages.orthoAndTerrainFailed);
    return;
  }
  if (isOrthoProcessing && isTerrainProcessing) {
    toast.warning(messages.orthoAndTerrainProcessing);
    return;
  }
  if (isOrthoDone && isTerrainCompleted) {
    toast.success(messages.orthoAndTerrainArePresent);
    return;
  }

  // Handle scenarios where ortho has specific statuses.
  if (isNil(orthoLayer)) {
    toast.error(messages.orthoNotPresent);
  } else if (isOrthoError) {
    toast.error(messages.orthoHasErrors);
  } else if (isOrthoProcessing) {
    toast.warning(messages.orthoIsProcessing);
  } else if (isOrthoDone) {
    toast.success(messages.onlyOrthoIsPresent);
  }

  // Handle scenarios where terrain has specific statuses.
  if (isNil(terrainStatus)) {
    toast.error(messages.terrainNotPresent);
  } else if (isTerrainError) {
    toast.error(messages.terrainHasFailed);
  } else if (isTerrainProcessing) {
    toast.warning(messages.terrainIsProcessing);
  } else if (isTerrainCompleted) {
    toast.success(messages.onlyTerrainIsPresent);
  }
};
