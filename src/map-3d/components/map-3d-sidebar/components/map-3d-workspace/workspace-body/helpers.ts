import { StatusIndicatorLevel } from '@aus-platform/design-system';
import { isEmpty, isUndefined } from 'lodash';
import {
  SelectLayerList,
  SelectLayerListItem,
  WorkspaceLayer,
} from '../../../shared';
import {
  BatchJobStatusIndicatorMapping,
  FileStatusIndicatorMapping,
  canShowHistogramLayerTypesList,
  initialHistogramData,
} from '../shared';
import { CreateWorkspaceLayerParams } from './types';
import {
  AddLayerResponse,
  AreaCategory,
  CapturedDsmCogInfo,
  LayerListItem,
  LayerType,
  WorkspaceResponseLayer,
} from 'shared/api';
import { BatchJobStatus } from 'shared/enums';
import { HistogramDataType } from 'shared/types';
import { CustomDate } from 'shared/utils';
import { Map3DCapturedDsmLayerType } from 'map-3d/types';
import { isTypeOf } from 'shared/type-utils';
import { FileType } from 'shared/hooks';

/**
 * Create DSM layer.
 *
 * @param layer DSM layer containing the fields like sourceFilePath required to display histogram.
 * @returns Layer formatted into Select Layer List object.
 */
export const createDSMLayer = (
  layer: Map3DCapturedDsmLayerType,
): SelectLayerListItem => {
  return {
    id: layer.iterationId,
    name: layer.name,
    type: LayerType.CapturedDsm,
    layerStatus: BatchJobStatusIndicatorMapping[layer.status],
    createdAt: new CustomDate(layer.createdAt),
    canEditFeatures: false,
    histogramData: {
      ...initialHistogramData,
      sourceFilePath: layer.sourceFilePath,
    },
  };
};

/**
 * Creates workspace layer from select layer list item or add layer response item,
 * to be added in active layer list.
 *
 * @param layer The layer item to convert.
 * @param iteration Iteration to which the layer belongs to.
 * @param show Flag to determine visibility of the layer.
 * @returns The resulting WorkspaceLayer object to be displayed in active layer list.
 */

export const createWorkspaceLayer = ({
  layer,
  project,
  site,
  iteration,
}: CreateWorkspaceLayerParams): WorkspaceLayer => {
  let histogramData: HistogramDataType | undefined = initialHistogramData,
    accessTags: string[] | undefined,
    layerStatus = StatusIndicatorLevel.Failed,
    canManageLayer,
    zIndex,
    isLayerVisible;

  if (isTypeOf<AddLayerResponse>(layer, 'featuresStyles')) {
    accessTags = layer.accessTags?.map(({ id }) => id);
    layerStatus = StatusIndicatorLevel.Done;
    canManageLayer = true;
  }

  if (isTypeOf<WorkspaceResponseLayer>(layer, 'zIndex')) {
    accessTags = layer.accessTags;
    zIndex = layer.zIndex;
    layerStatus = StatusIndicatorLevel.Done;
    canManageLayer = true;
    isLayerVisible = layer.show;
  }

  if (
    isTypeOf<SelectLayerListItem>(layer, 'layerStatus') &&
    layer.layerStatus
  ) {
    layerStatus = layer.layerStatus;
    canManageLayer = layer.canManageLayer;

    // We cannot however create slope map/DSM layer from Create Layer flow.
    if (canShowHistogramLayerTypesList.includes(layer.type)) {
      histogramData =
        layer.type === LayerType.SlopeMap
          ? initialHistogramData
          : layer.histogramData;
    }
  }

  isLayerVisible =
    isLayerVisible ??
    (layerStatus === StatusIndicatorLevel.Done ||
      layerStatus === StatusIndicatorLevel.Completed);

  return {
    ...layer,
    zIndex,
    accessTags,
    layerStatus,
    histogramData,
    project,
    site,
    iteration,
    canManageLayer,
    areaCategory: AreaCategory.Other,
    show: isLayerVisible,
  };
};

/**
 * Creates object from layer list API call to Select Layer List Item.
 * @param layerListResponse The response from the layer list API.
 * @param capturedDsmLayer DSM layer to be added.
 * @returns The resulting Select Layer List object to be displayed in select layer list.
 */
export const createSelectLayerList = (
  layerListResponse: LayerListItem[],
  canManageLayer: boolean,
  capturedDsmLayer?: Map3DCapturedDsmLayerType,
): SelectLayerList => {
  const selectLayerList: SelectLayerList = {};

  // Adding captured dsm layer to workspace layers.
  // TODO: Remove this and handle with createWorkspaceLayer after DSM as layer.
  const shouldAddDsmLayer =
    capturedDsmLayer &&
    capturedDsmLayer.status === BatchJobStatus.Completed &&
    !isEmpty(capturedDsmLayer.sourceFilePath);

  if (shouldAddDsmLayer) {
    selectLayerList[capturedDsmLayer.iterationId] =
      createDSMLayer(capturedDsmLayer);
  }

  layerListResponse.forEach((layer: LayerListItem) => {
    const layerFileStatus =
      layer.type === LayerType.Vector &&
      layer.files?.[0]?.type === FileType.Temporary
        ? layer.files?.[0]?.status
        : layer.status;

    if (!isUndefined(layerFileStatus)) {
      const selectLayer: SelectLayerListItem = {
        ...layer,
        canManageLayer,
        layerStatus: FileStatusIndicatorMapping[layerFileStatus],
      };
      selectLayerList[layer.id] = selectLayer;
    }
  });

  return selectLayerList;
};

export const addCapturedDsmMapLayer = (
  iterationId: string,
  capturedDsmCog: CapturedDsmCogInfo,
): Map3DCapturedDsmLayerType => {
  const {
    batchJob: capturedDsmCogBatchJobInfo,
    createdAt: capturedDsmCreatedAt,
  } = capturedDsmCog;

  const isCapturedDsmInProcess =
    capturedDsmCogBatchJobInfo.status === BatchJobStatus.Started ||
    capturedDsmCogBatchJobInfo.status === BatchJobStatus.Processing;

  // Add captured dsm layer to state.
  const capturedDsm3dMapLayer: Map3DCapturedDsmLayerType = {
    iterationId,
    name: 'DSM',
    isProcessing: isCapturedDsmInProcess,
    createdAt: capturedDsmCreatedAt,
    sourceFilePath: capturedDsmCogBatchJobInfo.path,
    status: capturedDsmCog.batchJob.status,
  };

  return capturedDsm3dMapLayer;
};
