import { StyleOptions } from '@aus-platform/cesium';
import {
  Icon,
  IconIdentifier,
  Pill,
  PillShape,
  PillVariant,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { isNil, size } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import {
  FileStatusIndicatorMapping,
  addOrToggleFeatures,
  getLayerMetadata,
  removeMapLayer,
} from '../../shared';
import { DatasetDetailsTooltip } from '../../shared/components';
import { LayerIcon } from '../../shared/components/layer-icon';
import {
  ListItem,
  ListItemVariant,
} from '../../../../shared/components/list-item';
import {
  FeatureCountTree,
  SelectAreaCategoryModal,
  areaCategoryOptions,
  areaCategoryPillLabel,
} from './components';
import { LayerActionItem } from './components/layer-action-item';
import { LayerMeatBallMenu } from './components/layer-meatball-menu';
import {
  canLayerShowHistogram,
  isLayerPresentOnMap,
  isLayerProcessing,
} from './helpers';
import { WorkSpaceActiveLayerPropType } from './types';
import { FileType } from 'shared/hooks';
import { getInitialRescaleValue } from 'shared/components';
import {
  AreaCategory,
  LayerType,
  UpdateLayer,
  handleResponseErrorMessage,
  handleResponseMessage,
  useCogMetadata,
  useFeatureList,
  useLayer,
  useUpdateLayer,
} from 'shared/api';
import { Map3DTerrainProviderType } from 'map-3d/types';
import {
  WorkspaceRightSideCard,
  addTerrainLayer,
  addWorkspaceLayer,
  selectMap3DState,
  selectMap3dWorkspace,
  setIsWorkspaceLoading,
  setRightSideCard,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import {
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from 'map-3d/components/map-3d-sidebar/shared';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const WorkSpaceActiveLayer: React.FC<WorkSpaceActiveLayerPropType> = ({
  layer,
  className,
  isChecked,
  onClick,
  index,
}) => {
  // Hooks.
  const dispatch = useAppDispatch();

  // Selectors.
  const { cesiumProxy, isWorkspaceLoading } = useAppSelector(selectMap3DState);
  const {
    drawingTools,
    terrainProvider,
    currentEditableLayerId,
    workspaceLayers,
  } = useAppSelector(selectMap3dWorkspace);

  // States.
  const [showFeatureCount, setShowFeatureCount] = useState<boolean>(false);
  const [showSelectAreaCategoryModal, setShowSelectAreaCategoryModal] =
    useState<boolean>(false);

  // Constants.
  const isInEditMode = layer.id === currentEditableLayerId;

  const shouldFetchCogMetadata =
    layer.type === LayerType.CapturedDsm &&
    !isLayerProcessing(layer) &&
    !isLayerPresentOnMap(layer) &&
    !isNil(layer.iteration?.id);

  const shouldFetchLayerData =
    !isLayerPresentOnMap(layer) &&
    !isLayerProcessing(layer) &&
    layer.type !== LayerType.CapturedDsm;

  const showAreaCategoryPill =
    layer.areaCategory !== AreaCategory.Other &&
    layer.type === LayerType.Vector;

  // Apis.
  // TODO: Remove after implementing DSM as a layer.
  const {
    data: cogMetadata,
    isSuccess: isCOGMetadataSuccess,
    isLoading: isCOGMetadataLoading,
  } = useCogMetadata(
    {
      iterationId: layer.iteration?.id ?? '',
      fileType: FileType.CapturedDsm,
    },
    shouldFetchCogMetadata,
  );

  const {
    mutate: sendLayerUpdateRequest,
    data: updateLayerResponse,
    isError: isErrorUpdateLayer,
    error: updateLayerError,
    isPending: isLoadingUpdateLayer,
    isSuccess: isSuccessUpdateLayer,
  } = useUpdateLayer();

  const {
    data: layerResponse,
    isFetching: isLoadingLayerResponse,
    isSuccess: isSuccessLayerResponse,
    isError: isErrorLayerResponse,
    error: layerResponseError,
    refetch: refetchLayer,
  } = useLayer(layer.id, shouldFetchLayerData);

  const {
    data: featuresResponse,
    isFetching: isLoadingFeaturesResponse,
    isSuccess: isSuccessFeaturesResponse,
    isError: isErrorFeaturesResponse,
    error: featuresResponseError,
    refetch: refetchFeatures,
  } = useFeatureList(layer.id, undefined, false);

  // Conditional variables.
  const isLoading =
    isLayerProcessing(layer) ||
    (isCOGMetadataLoading && canLayerShowHistogram(layer)) ||
    isLoadingLayerResponse ||
    isLoadingFeaturesResponse;

  // Handlers.
  const getListVariant = (): ListItemVariant => {
    if (layer.id === currentEditableLayerId) {
      return ListItemVariant.Warning;
    } else {
      return ListItemVariant.Primary;
    }
  };

  // Redux state handlers.
  const updateLayer = (layers: WorkspaceLayerListObj) => {
    dispatch(updateWorkspaceLayer(layers));
  };

  const addTerrainLayerHandler = (
    terrainLayerPayload: Map3DTerrainProviderType,
  ) => {
    dispatch(addTerrainLayer(terrainLayerPayload));
  };

  const addHistogram = (initialRescaleValue, sourceFilePath, metadata) => {
    if (!cesiumProxy) {
      return;
    }

    metadata = metadata ?? layer.histogramData?.metadata;
    sourceFilePath = sourceFilePath ?? layer.histogramData?.sourceFilePath;

    if (!sourceFilePath) {
      return;
    }

    // Remove previous map layer if it exists.
    if (layer.mapLayer) {
      removeMapLayer(cesiumProxy, layer.mapLayer);
    }

    // Add new map layer.
    const mapLayer = cesiumProxy.layerManager.addHistogramLayerToCesium(
      {
        metadata,
        sourceFilePath,
        rescale: initialRescaleValue,
        opacity: layer.histogramData?.opacity ?? 100,
      },
      {
        show: layer.show ?? true,
        zIndex: layer.zIndex,
      },
    );

    updateLayer({
      [layer.id]: {
        ...layer,
        mapLayer,
        zIndex: layer.zIndex ?? cesiumProxy?.layerManager.getZIndex(mapLayer),
        histogramData: {
          metadata,
          sourceFilePath,
          rescale: initialRescaleValue,
          opacity: 100,
        },
      },
    });
  };

  const enableLayerEditing = () => {
    if (!featuresResponse) {
      return;
    }

    const { featuresStyles, mapLayer } = layer;
    const styleOptions: StyleOptions = {
      pointStyleOptions: featuresStyles?.point,
      lineStyleOptions: featuresStyles?.line,
      polygonStyleOptions: featuresStyles?.polygon,
      textboxStyleOptions: featuresStyles?.textbox,
    };

    const features = featuresResponse.data.features.map((feature) => ({
      ...feature,
      selected: false,
    }));

    if (drawingTools) {
      // Toggle Features if they are already there else import them.
      addOrToggleFeatures(features, layer.id, drawingTools, styleOptions);
    }

    let zIndex;
    if (mapLayer && cesiumProxy) {
      zIndex = cesiumProxy.viewer.imageryLayers.indexOf(mapLayer);
      mapLayer.show = false;
    }

    const updatedLayer: WorkspaceLayer = {
      ...layer,
      features,
      zIndex,
      mapLayer,
    };

    updateLayer({
      [layer.id]: updatedLayer,
    });
    dispatch(setRightSideCard(WorkspaceRightSideCard.FeatureStyling));
  };

  // Layer response handlers.
  const onLayerResponseSuccess = async () => {
    if (!layerResponse) {
      return;
    }

    if (layer.mapLayer && cesiumProxy) {
      removeMapLayer(cesiumProxy, layer.mapLayer);
    }

    const updatedLayer: WorkspaceLayer = {
      ...layer,
      ...layerResponse,
      layerStatus: FileStatusIndicatorMapping[layerResponse.status],
      refresh: refetchLayer,
    };

    let showMapLayer;

    if (isNil(layer.mapLayer)) {
      // Initially adding map layer.
      showMapLayer = true;
    } else if (currentEditableLayerId === layer.id && !layer.mapLayer.show) {
      /**
       * Layer is in editing mode, we're updating the style.
       * Tiled Layer should be hidden until and unless we get out of editing mode
       **/
      showMapLayer = false;
    } else if (
      !isNil(currentEditableLayerId) &&
      currentEditableLayerId !== layer.id &&
      !layer.mapLayer.show
    ) {
      /**
       * A layer is in editing mode, and we're switching to edit another layer.
       * Previous editable layer should get back to tiled mode.
       * We enable showMapLayer, in order to display the tiled view of previous editable layer.
       **/
      showMapLayer = true;
    } else {
      showMapLayer = layer.mapLayer.show;
    }

    isWorkspaceLoading
      ? await addMapLayerWithRetry(updatedLayer, layer.show ?? showMapLayer)
      : await addMapLayerWithoutRetry(updatedLayer, showMapLayer);
  };

  const addMapLayerWithoutRetry = async (
    layer: WorkspaceLayer,
    showMapLayer: boolean,
  ) => {
    if (layer.type === LayerType.SlopeMap) {
      const metadata = getLayerMetadata(layer);
      const sourceFilePath = layer.files?.[0].s3Key;

      // @FIXME 💩 - hack pro max - use function to load histogram layer
      if (metadata && sourceFilePath) {
        const initialRescaleValue = getInitialRescaleValue(
          metadata,
          sourceFilePath,
        );

        initialRescaleValue &&
          addHistogram(initialRescaleValue, sourceFilePath, metadata);
      }
    } else {
      const mapLayer = await cesiumProxy?.layerManager.addMapLayer({
        layer,
        addTerrainLayerCallback: addTerrainLayerHandler,
        show: showMapLayer,
        terrainProvider,
      });

      const zIndex = cesiumProxy?.layerManager.getZIndex(mapLayer);

      updateLayer({
        [layer.id]: { ...layer, mapLayer, zIndex, show: showMapLayer },
      });
    }
  };

  const maxRetries = 10;

  const addHistogramLayerWithoutRetry = (metadata, sourceFilePath) => {
    const initialRescaleValue = getInitialRescaleValue(
      metadata,
      sourceFilePath,
    );

    initialRescaleValue &&
      addHistogram(initialRescaleValue, sourceFilePath, cogMetadata);
  };

  // @FIXME 💩 - create proper generalized functions.
  const addHistogramLayerWithRetry = async (metadata, sourceFilePath) => {
    if (!cesiumProxy || isNil(layer.zIndex)) {
      return;
    }
    let retries = 0;
    while (retries < maxRetries) {
      const currentLayerCount = cesiumProxy.layerManager.getLength();

      // All shareable workspace layers have been loaded, reset flag
      if (currentLayerCount === size(workspaceLayers)) {
        dispatch(setIsWorkspaceLoading(false));
      }

      if (currentLayerCount >= layer.zIndex) {
        addHistogramLayerWithoutRetry(metadata, sourceFilePath);
        break;
      } else {
        // Wait for the specified delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }
    }

    if (retries === maxRetries) {
      // Handle the case where the layer couldn't be added after maximum retries
      console.error('Failed to add layer after maximum retries');
    }
  };

  const addMapLayerWithRetry = async (
    layer: WorkspaceLayer,
    showMapLayer: boolean,
  ) => {
    if (!cesiumProxy || isNil(layer.zIndex)) {
      return;
    }
    let retries = 0;
    while (retries < maxRetries) {
      const currentLayerCount = cesiumProxy.layerManager.getLength();

      // All shareable workspace layers have been loaded, reset flag
      if (currentLayerCount === size(workspaceLayers)) {
        dispatch(setIsWorkspaceLoading(false));
      }

      if (currentLayerCount >= layer.zIndex) {
        await addMapLayerWithoutRetry(layer, showMapLayer);
        break;
      } else {
        // Wait for the specified delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 500));
        retries++;
      }
    }

    if (retries === maxRetries) {
      // Handle the case where the layer couldn't be added after maximum retries
      console.error('Failed to add layer after maximum retries');
    }
  };

  const onCloseSelectAreaCategory = () => {
    setShowSelectAreaCategoryModal(false);
  };

  const onSaveSelectedAreaCategory = (selectedAreaCategory: AreaCategory) => {
    const updateLayerAreaCategoryPayload: UpdateLayer = {
      id: layer.id,
      data: {
        areaCategory: selectedAreaCategory,
      },
    };
    sendLayerUpdateRequest(updateLayerAreaCategoryPayload);
  };

  // useEffects.
  useEffect(() => {
    handleResponseErrorMessage(isErrorLayerResponse, layerResponseError);
  }, [isErrorLayerResponse, layerResponseError]);

  // useEffect - Add map layer.
  useEffect(() => {
    if (!isSuccessLayerResponse || !layerResponse) {
      return;
    }

    onLayerResponseSuccess();
  }, [layerResponse, isSuccessLayerResponse]);

  // useEffect - Update layer on area category update.
  useEffect(() => {
    if (isSuccessUpdateLayer && updateLayerResponse) {
      const updatedAreaCategoryValue: AreaCategory =
        updateLayerResponse.data.areaCategory;

      const updatedWorkspaceLayer: WorkspaceLayer = {
        ...layer,
        areaCategory: updatedAreaCategoryValue,
      };

      dispatch(addWorkspaceLayer(updatedWorkspaceLayer));
      setShowSelectAreaCategoryModal(false);
    }
    handleResponseMessage(
      isSuccessUpdateLayer,
      isErrorUpdateLayer,
      updateLayerResponse,
      updateLayerError,
    );
  }, [
    isSuccessUpdateLayer,
    updateLayerResponse,
    isErrorUpdateLayer,
    updateLayerError,
  ]);

  // useEffect - Update histogram after DSM COG metadata or Slope map layer fetch.
  // TODO: Merge this with layerData response useEffect hook after ortho and dsm as layers.
  useEffect(() => {
    if (
      layer.type === LayerType.CapturedDsm &&
      isCOGMetadataSuccess &&
      !isLayerPresentOnMap(layer) &&
      layer.histogramData?.sourceFilePath
    ) {
      const { sourceFilePath } = layer.histogramData;

      isWorkspaceLoading
        ? addHistogramLayerWithRetry(cogMetadata, sourceFilePath)
        : addHistogramLayerWithoutRetry(cogMetadata, sourceFilePath);
    }
  }, [cogMetadata]);

  //  Features response
  useEffect(() => {
    handleResponseErrorMessage(isErrorFeaturesResponse, featuresResponseError);
  }, [isErrorFeaturesResponse, featuresResponseError]);

  // useEffect - Add map layer.
  useEffect(() => {
    if (!isSuccessFeaturesResponse || !featuresResponse) {
      return;
    }
    enableLayerEditing();
  }, [featuresResponse]);

  // Renders.
  return (
    <div className="workspace-active-layer-container">
      <DatasetDetailsTooltip
        layerName={layer.name}
        siteName={layer.site?.name}
        iterationName={layer.iteration?.name}
      >
        <ListItem
          className={className}
          disabled={isLoading || isErrorLayerResponse}
          variant={getListVariant()}
          checked={isChecked}
          onClick={(event: React.MouseEvent<HTMLInputElement>) =>
            onClick(event, index)
          }
        >
          <ListItem.Avatar>
            <LayerIcon layer={layer} />
          </ListItem.Avatar>
          <ListItem.Content>
            <div className="workspace-active-layer__parent-details-container">
              <div className="workspace-active-layer__parent-details__name">
                {layer.name}
              </div>
              <div className="workspace-active-layer__parent-details__parent">
                <span>{layer.site?.name}</span>
                <Icon identifier={IconIdentifier.ChevronSmallRight} size={12} />
                <span>{layer.iteration?.name}</span>
              </div>
            </div>
            {showAreaCategoryPill && (
              <Tooltip
                hoverText={
                  areaCategoryOptions.filter((category) => {
                    return category.value === layer.areaCategory;
                  })[0]?.label
                }
                placement={Placement.Top}
                className="workspace-active-layer__area-category-tooltip"
              >
                <Pill
                  className="workspace-active-layer__area-category-pill"
                  shape={PillShape.Rectangle}
                  variant={PillVariant.Info}
                >
                  {areaCategoryPillLabel[layer.areaCategory]}
                </Pill>
              </Tooltip>
            )}
          </ListItem.Content>
          <ListItem.Action>
            {isInEditMode ? (
              <Pill shape={PillShape.Rectangle} variant={PillVariant.Warning}>
                Editing
              </Pill>
            ) : (
              <LayerActionItem
                layer={layer}
                refetchFeatures={refetchFeatures}
              />
            )}
            {isLoading && (
              <Spinner className="workspace-active-layer-spinner" />
            )}
            <LayerMeatBallMenu
              layer={layer}
              showFeatureCount={showFeatureCount}
              setShowFeatureCount={setShowFeatureCount}
              setShowSelectAreaCategoryModal={setShowSelectAreaCategoryModal}
            />
          </ListItem.Action>
        </ListItem>
      </DatasetDetailsTooltip>

      {layer.type === LayerType.Vector && (
        <FeatureCountTree
          featuresCount={layer.featuresCount}
          visible={showFeatureCount}
        />
      )}

      {/* Select Area Category Modal */}
      {showSelectAreaCategoryModal && (
        <SelectAreaCategoryModal
          layerAreaCategory={layer.areaCategory}
          onClose={onCloseSelectAreaCategory}
          onSave={onSaveSelectedAreaCategory}
          isLoading={isLoadingUpdateLayer}
        />
      )}
    </div>
  );
};
