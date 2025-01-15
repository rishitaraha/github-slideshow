import {
  CheckBox,
  ColorClass,
  FormMessage,
  FormMessageVariant,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  Placement,
  SelectOption,
  SideCard,
  SideCardLocation,
  Spinner,
  StatusIndicatorLevel,
  Tooltip,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { cloneDeep, isEmpty, isNil, partition, values } from 'lodash';
import React, { useEffect, useState } from 'react';
import { resetSwipeMap } from '../helpers';
import {
  resetBoundingBox,
  selectSwipeMap3D,
  setLayersBoundingBox,
  setLeftIteration,
  setLeftLayerList,
  setLeftPropertyLayerId,
  setRightIteration,
  setRightLayerList,
  setRightPropertyLayerId,
} from '../swipe-map-3d-slice';
import { SwipeMapLayer } from '../types';
import { DatasetSidecard } from './enums';
import {
  calculateBoundingBox,
  createSwipeMapDsmLayer,
  prioritizeDsmLayers,
} from './helpers';
import { SwipeMap3DSidecardProps } from './types';
import { getLayerMetadata } from 'map-3d/components';
import {
  IterationListItem,
  LayerType,
  useCogMetadata,
  useIterationsList,
  useLayerList,
} from 'shared/api';
import { getInitialRescaleValue } from 'shared/components';
import { BatchJobStatus, FileStatus } from 'shared/enums';
import { FileType } from 'shared/hooks';
import { HistogramDataType } from 'shared/types';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';

export const SwipeMap3dSidecard: React.FC<SwipeMap3DSidecardProps> = ({
  isLeftSidecard,
  show,
  onClickToggleSidecardButton,
  isLayerPropertySidecardOpened,
  openLayerPropertySidecard,
}) => {
  // Dispatch.
  const dispatch = useAppDispatch();

  // Selectors.
  const {
    splitViewer,
    selectedSite,
    layersBoundingBox,
    leftLayerList,
    rightLayerList,
    leftIteration,
    rightIteration,
  } = useAppSelector(selectSwipeMap3D);

  // States.
  const [iterationOptionsList, setIterationOptionsList] =
    useState<SelectOption<IterationListItem>[]>();

  // Constants.
  const sidecardTitle = isLeftSidecard
    ? 'Iteration - Left Pane'
    : 'Iteration - Right Pane';

  const sidecardPlacement = isLeftSidecard
    ? SideCardLocation.Start
    : SideCardLocation.End;

  const activeIteration = isLeftSidecard ? leftIteration : rightIteration;
  const setIteration = isLeftSidecard ? setLeftIteration : setRightIteration;
  const iterationOption: SelectOption<IterationListItem> | null =
    activeIteration
      ? {
          label: activeIteration?.name,
          value: activeIteration,
        }
      : null;
  const terrainStatus = activeIteration?.capturedDsmCog?.batchJob.status;
  const isDsmPresent =
    activeIteration?.capturedDsm?.status === StatusIndicatorLevel.Done;

  const containerClassname = classNames('swipe-map-3d-sidecard-container', {
    'swipe-map-3d-sidecard-container--hidden': isLayerPropertySidecardOpened,
  });

  const layersContainerClassname = classNames('swipe-map-3d-sidecard__layers', {
    'swipe-map-3d-sidecard__layers--no-terrain':
      terrainStatus !== BatchJobStatus.Completed || !isDsmPresent,
  });

  const swipeMapLayerList = isLeftSidecard ? leftLayerList : rightLayerList;
  const setLayerList = isLeftSidecard ? setLeftLayerList : setRightLayerList;

  const [baseLayerList, layerList] = partition(
    swipeMapLayerList,
    (layer) => layer.type === LayerType.Orthomosaic,
  );

  // Apis.
  const {
    data: iterationListResponse,
    isSuccess: isSuccessIterationList,
    isFetching: isFetchingIterationList,
  } = useIterationsList(
    {
      siteId: selectedSite!.id,
    },
    !isNil(selectedSite),
  );

  const {
    data: layerListResponse,
    isFetching: isLoadingLayerList,
    isSuccess: isSuccessLayerList,
  } = useLayerList(
    {
      iterationId: activeIteration?.id ?? '',
      // Modify include fields wrt what's needed for histogram.
      excludeFields: [
        'features',
        'featuresCount',
        'featuresStyles',
        'clampedStatus',
        'areaCategory',
      ],
    },
    !isNil(activeIteration),
  );

  const {
    data: cogMetadata,
    isSuccess: isCOGMetadataSuccess,
    isLoading: isCOGMetadataLoading,
  } = useCogMetadata(
    {
      iterationId: activeIteration?.id ?? '',
      fileType: FileType.CapturedDsm,
    },
    !isNil(activeIteration?.id),
    // Adding left/right sidecard in query key because otherwise the COG metadata call for the same iteration selected in both left & right will be made only once.
    isLeftSidecard ? DatasetSidecard.Left : DatasetSidecard.Right,
  );

  // useEffects.
  // Adding DSM Layer.
  useEffect(() => {
    if (isCOGMetadataSuccess && !isNil(activeIteration)) {
      const { id, capturedDsmCog } = activeIteration;

      if (capturedDsmCog) {
        const dsmSwipeMapLayer = createSwipeMapDsmLayer(
          id,
          cogMetadata,
          capturedDsmCog,
        );

        const mappedLayerList = {
          ...swipeMapLayerList,
          [id]: dsmSwipeMapLayer,
        };
        dispatch(setLayerList({ ...mappedLayerList }));
      }
    }
  }, [cogMetadata, isCOGMetadataSuccess]);

  useEffect(() => {
    if (isSuccessIterationList && !isNil(iterationListResponse)) {
      const iterationList: SelectOption<IterationListItem>[] | undefined =
        iterationListResponse.list.map((iteration) => {
          return {
            label: iteration.name,
            value: iteration,
          };
        });

      setIterationOptionsList(iterationList);
    }
  }, [isSuccessIterationList, iterationListResponse]);

  useEffect(() => {
    if (isSuccessLayerList && layerListResponse) {
      const layerListObject = layerListResponse.list.reduce(
        (prev, layer) => {
          let histogramData: HistogramDataType | undefined;

          if (layer.type === LayerType.SlopeMap) {
            const metadata = getLayerMetadata(layer);
            const sourceFilePath = layer.files?.[0].s3Key;

            if (metadata && sourceFilePath) {
              const initialRescaleValue = getInitialRescaleValue(
                metadata,
                sourceFilePath,
              );

              histogramData = {
                sourceFilePath,
                metadata,
                rescale: initialRescaleValue,
                opacity: 100,
              };
            }
          }

          prev[layer.id] = {
            ...layer,
            histogramData,
            show: false,
          };

          return prev;
        },
        { ...swipeMapLayerList },
      );

      dispatch(setLayerList({ ...layerListObject }));
    }
  }, [isSuccessLayerList, layerListResponse]);

  // Handlers.
  const resetAll = () => {
    // Reset Map.
    resetSwipeMap(swipeMapLayerList, splitViewer, isLeftSidecard);

    // Reset Redux.
    dispatch(setLayerList({}));
    dispatch(setIteration(null));
    dispatch(resetBoundingBox());
  };

  const onChangeIteration = (
    selectedOption: SelectOption<IterationListItem>,
  ) => {
    const { id, terrainTiles } = selectedOption.value;
    resetAll();
    dispatch(setIteration(selectedOption.value));

    if (terrainTiles?.status === BatchJobStatus.Completed) {
      splitViewer?.addTerrain(id, terrainTiles.path, isLeftSidecard);
    }
  };

  // Toggling the layer's checkbox.
  const onClickCheckbox = async (layer: SwipeMapLayer) => {
    let mapLayer = layer.mapLayer;

    if (!layer.show) {
      splitViewer?.zoomToLayer(layer);
      updateCumulativeLayerBounds(layer);

      const updatedLayer = cloneDeep(layer);
      updatedLayer.mapLayer = layer.mapLayer;

      mapLayer = await splitViewer?.addMapLayer({
        layer: updatedLayer,
        isLeftViewer: isLeftSidecard,
        show: !layer.show,
      });
    } else {
      mapLayer && splitViewer?.removeMapLayer(isLeftSidecard, [mapLayer]);
      mapLayer = undefined;
    }

    const layers = {
      ...swipeMapLayerList,
      [layer.id]: { ...layer, show: !layer.show, mapLayer },
    };

    dispatch(setLayerList(layers));
  };

  const updateCumulativeLayerBounds = (layer: SwipeMapLayer) => {
    const bounds = getLayerMetadata(layer)?.bounds;
    let updatedBounds;

    if (!isNil(layersBoundingBox) && !isNil(bounds)) {
      updatedBounds = calculateBoundingBox(bounds, layersBoundingBox);
    } else {
      updatedBounds = bounds;
    }

    if (!isNil(updatedBounds)) {
      dispatch(setLayersBoundingBox(updatedBounds));
    }
  };

  const onClickInfoTool = (selectedLayerId: string) => {
    const setPropertyLayerId = isLeftSidecard
      ? setLeftPropertyLayerId
      : setRightPropertyLayerId;

    dispatch(setPropertyLayerId(selectedLayerId));
    openLayerPropertySidecard(isLeftSidecard);
  };

  const isLayerProcessing = (layer: SwipeMapLayer) => {
    switch (layer.type) {
      case LayerType.Vector:
      case LayerType.MapBox:
        return false;
      default:
        return layer.status === FileStatus.Processing;
    }
  };

  return (
    <SideCard
      title={sidecardTitle}
      onClose={() => {}}
      showCloseButton={false}
      show={show}
      placement={sidecardPlacement}
      className="swipe-map-3d-sidecard"
      containerClassName={containerClassname}
      onClickToggleSidecardButton={onClickToggleSidecardButton}
      backdrop={false}
    >
      <div className="swipe-map-3d-sidecard">
        <InputGroup>
          <div className="swipe-map-3d-sidecard__header">Select Iteration</div>
          <Input.Select
            value={iterationOption}
            options={iterationOptionsList}
            isLoading={isFetchingIterationList}
            placeholder="Select Iteration"
            onChange={onChangeIteration}
          />
          {!isNil(activeIteration) &&
            (terrainStatus !== BatchJobStatus.Completed || !isDsmPresent) && (
              <FormMessage
                variant={FormMessageVariant.Error}
                message={
                  !isDsmPresent
                    ? 'Terrain data is not available for the selected iteration'
                    : terrainStatus === BatchJobStatus.Failed ||
                        isNil(terrainStatus)
                      ? 'Selected Iteration’s terrain generation failed'
                      : 'Selected Iteration’s terrain is being generated'
                }
              />
            )}
        </InputGroup>
        {isLoadingLayerList || isCOGMetadataLoading ? (
          <Spinner />
        ) : (
          <div className={layersContainerClassname}>
            <InputGroup className="swipe-map-3d-sidecard__base-layer">
              <div className="swipe-map-3d-sidecard__header">Base Layers</div>
              {isEmpty(baseLayerList) ? (
                <div className="swipe-map-3d-sidecard__empty">
                  No layers available to display.
                </div>
              ) : (
                <div className="swipe-map-3d-sidecard__base-layer-content">
                  {values(baseLayerList).map((layer) => (
                    <Tooltip
                      key={`{${layer.id}-${isLeftSidecard ? 'left' : 'right'}}`}
                      hoverText={layer.name}
                      placement={
                        isLeftSidecard ? Placement.Right : Placement.Left
                      }
                      className="swipe-map-3d-sidecard__tooltip"
                    >
                      <CheckBox
                        title={layer.name}
                        showCard={true}
                        checked={layer.show}
                        onClick={() => onClickCheckbox(layer)}
                        disabled={layer.status !== FileStatus.Done}
                        isLoading={layer.status === FileStatus.Processing}
                      >
                        <Icon
                          identifier={IconIdentifier.InfoCircle}
                          size={15}
                          colorClass={ColorClass.Neutral250}
                          onClick={(event) => {
                            event.stopPropagation();
                            onClickInfoTool(layer.id);
                          }}
                        />
                      </CheckBox>
                    </Tooltip>
                  ))}
                </div>
              )}
            </InputGroup>
            <InputGroup className="swipe-map-3d-sidecard__layer">
              <div className="swipe-map-3d-sidecard__header">Layers</div>
              {isNil(layerList) || isEmpty(layerList) ? (
                <div className="swipe-map-3d-sidecard__empty">
                  No layers available to display.
                </div>
              ) : (
                <div className="swipe-map-3d-sidecard__layer-content">
                  {prioritizeDsmLayers(layerList).map((layer) => (
                    <Tooltip
                      key={`{${layer.id}-${isLeftSidecard ? 'left' : 'right'}}`}
                      hoverText={layer.name}
                      placement={
                        isLeftSidecard ? Placement.Right : Placement.Left
                      }
                    >
                      <CheckBox
                        key={`{${layer.id}-${isLeftSidecard ? DatasetSidecard.Left : DatasetSidecard.Right}}`}
                        title={layer.name}
                        showCard={true}
                        checked={layer.show}
                        onClick={() => onClickCheckbox(layer)}
                        disabled={
                          isLayerProcessing(layer) ||
                          layer.status !== FileStatus.Done
                        }
                        isLoading={isLayerProcessing(layer)}
                      >
                        <Icon
                          identifier={IconIdentifier.InfoCircle}
                          size={15}
                          colorClass={ColorClass.Neutral250}
                          onClick={(event) => {
                            event.stopPropagation();
                            onClickInfoTool(layer.id);
                          }}
                        />
                      </CheckBox>
                    </Tooltip>
                  ))}
                </div>
              )}
            </InputGroup>
          </div>
        )}
      </div>
    </SideCard>
  );
};
