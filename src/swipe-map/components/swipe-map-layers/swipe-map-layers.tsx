import {
  IconButton,
  IconIdentifier,
  Input,
  InputGroup,
  SelectOption,
  SideCard,
  SideCardLocation,
  Spinner,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import React, { useEffect, useState } from 'react';
import {
  IterationListItem,
  useIterationsList,
  useLayerList,
} from '../../../shared/api';

import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import { OlLayersType } from '../../../shared/resources/openlayers';
import {
  resetDataset,
  selectSwipeMapDataset,
  setLeftIteration,
  setRightIteration,
} from '../../swipe-map-slices';
import { addSwipeMapLayer } from './helpers';
import { SwipeMapLayerList } from './swipe-map-layer-list';
import { SwipeMapLayersProps } from './types';

export const SwipeMapLayers: React.FC<SwipeMapLayersProps> = ({
  siteId,
  map,
  swipeRef,
  setIsLeftSideCardExpanded,
  setIsRightSideCardExpanded,
  onCloseSideCard,
  showSideCard,
  setShowSideCard,
}) => {
  // Selectors
  const dataset = useAppSelector(selectSwipeMapDataset);

  // States.
  const [leftLayers, setLeftLayers] = useState<OlLayersType>({});
  const [rightLayers, setRightLayers] = useState<OlLayersType>({});
  const [leftOrthomosaic, setLeftOrthomosaic] = useState<OlLayersType | null>(
    null,
  );
  const [rightOrthomosaic, setRightOrthomosaic] = useState<OlLayersType | null>(
    null,
  );
  const [leftSideCardIterations, setLeftSideCardIterations] =
    useState<SelectOption<IterationListItem>[]>();
  const [rightSideCardIterations, setRightSideCardIterations] =
    useState<SelectOption<IterationListItem>[]>();

  // Variables.
  const selectedLeftIterationOption = dataset.leftIteration
    ? {
        label: dataset.leftIteration.name,
        value: dataset.leftIteration,
      }
    : null;

  const selectedRightIterationOption = dataset.rightIteration
    ? {
        label: dataset.rightIteration.name,
        value: dataset.rightIteration,
      }
    : null;

  // Hooks.
  const dispatch = useAppDispatch();

  // Apis.
  const {
    data: iterationsResponse,
    isLoading: iterationsIsLoading,
    isSuccess: iterationsIsSuccess,
  } = useIterationsList(
    {
      siteId: siteId,
    },
    !!siteId,
  );

  const {
    data: leftLayerListResponse,
    isSuccess: isSuccessLeftLayerList,
    isLoading: isLoadingLeftLayerList,
  } = useLayerList(
    {
      iterationId: dataset.leftIteration?.id ?? '',
      excludeFields: ['features', 'featuresCount'],
    },
    !isNil(dataset.leftIteration),
  );

  const {
    data: rightLayerListResponse,
    isSuccess: isSuccessRightLayerList,
    isLoading: isLoadingRightLayerList,
  } = useLayerList(
    { iterationId: dataset.rightIteration?.id ?? '' },
    !isNil(dataset.rightIteration),
  );

  // useEffects.
  useEffect(() => {
    if (iterationsResponse && iterationsIsSuccess) {
      setLeftSideCardIterations(
        filterIterations(dataset.rightIteration?.id ?? null),
      );
      setRightSideCardIterations(
        filterIterations(dataset.leftIteration?.id ?? null),
      );
    }
  }, [iterationsResponse, iterationsIsSuccess]);

  useEffect(() => {
    removeLayersFromMap(
      leftOrthomosaic,
      leftLayers,
      setLeftOrthomosaic,
      setLeftLayers,
    );
    removeLayersFromMap(
      rightOrthomosaic,
      rightLayers,
      setRightOrthomosaic,
      setRightLayers,
    );
    dispatch(resetDataset());
  }, [siteId]);

  useEffect(() => {
    setIsRightSideCardExpanded(showSideCard.right);
  }, [showSideCard.right]);

  useEffect(() => {
    setIsLeftSideCardExpanded(showSideCard.left);
  }, [showSideCard.left]);

  useEffect(() => {
    if (rightLayerListResponse && isSuccessRightLayerList) {
      const layers: OlLayersType = {};

      rightLayerListResponse.list.forEach((layer) => {
        const swipeMapLayer = addSwipeMapLayer(
          layer,
          true,
          setRightOrthomosaic,
          swipeRef,
          map,
        );
        if (!isNil(swipeMapLayer)) {
          layers[layer.id] = swipeMapLayer;
        }
      });

      setRightLayers(layers);
    }
  }, [rightLayerListResponse, isSuccessRightLayerList]);

  useEffect(() => {
    if (leftLayerListResponse && isSuccessLeftLayerList) {
      const layers: OlLayersType = {};

      leftLayerListResponse.list.forEach((layer) => {
        const swipeMapLayer = addSwipeMapLayer(
          layer,
          false,
          setLeftOrthomosaic,
          swipeRef,
          map,
        );
        if (!isNil(swipeMapLayer)) {
          layers[layer.id] = swipeMapLayer;
        }
      });

      setLeftLayers(layers);
    }
  }, [leftLayerListResponse, isSuccessLeftLayerList]);

  // Handlers.
  const filterIterations = (selectedIterationId: string | null) => {
    let iterations;
    const filteredIterations = iterationsResponse?.list.filter(
      ({ id: iterationId }) => iterationId !== selectedIterationId,
    );
    if (!isNil(filteredIterations)) {
      iterations = filteredIterations.map((iteration) => {
        return {
          label: iteration.name,
          value: iteration,
        };
      });
      return iterations;
    }

    return filteredIterations;
  };

  const onLeftIterationChange = (
    selectedIteration: SelectOption<IterationListItem>,
  ) => {
    removeLayersFromMap(
      leftOrthomosaic,
      leftLayers,
      setLeftOrthomosaic,
      setLeftLayers,
    );
    dispatch(setLeftIteration(selectedIteration.value));
    setRightSideCardIterations(filterIterations(selectedIteration.value.id));
  };

  const onRightIterationChange = (
    selectedIteration: SelectOption<IterationListItem>,
  ) => {
    removeLayersFromMap(
      rightOrthomosaic,
      rightLayers,
      setRightOrthomosaic,
      setRightLayers,
    );
    dispatch(setRightIteration(selectedIteration.value));

    setLeftSideCardIterations(filterIterations(selectedIteration.value.id));
  };

  const removeLayersFromMap = (
    orthoLayers: OlLayersType | null,
    layers: OlLayersType,
    setLayers,
    setOrthoLayers,
  ) => {
    if (orthoLayers) {
      Object.values(orthoLayers).forEach(({ tileLayer }) => {
        if (tileLayer) {
          map.removeLayer(tileLayer);
        }
      });
    }
    if (layers) {
      Object.values(layers).forEach(({ tileLayer }) => {
        if (tileLayer) {
          map.removeLayer(tileLayer);
        }
      });
    }
    setOrthoLayers(null);
    setLayers({});
  };

  const onOpenLeftSideCard = () =>
    setShowSideCard({ ...showSideCard, left: true });

  const onCloseLeftSideCard = () => {
    const newShowSideCardState = { ...showSideCard, left: false };
    onCloseSideCard(newShowSideCardState);
    setShowSideCard(newShowSideCardState);
  };

  const onOpenRightSideCard = () =>
    setShowSideCard({ ...showSideCard, right: true });

  const onCloseRightSideCard = () => {
    const newShowSideCardState = { ...showSideCard, right: false };
    onCloseSideCard(newShowSideCardState);
    setShowSideCard(newShowSideCardState);
  };

  // Renders.
  return (
    <div className="swipe-map-layers">
      {/* Action buttons */}
      <IconButton
        iconIdentifier={IconIdentifier.ChevronSmallRight}
        className="swipe-map-layers__action-btn left"
        onClick={onOpenLeftSideCard}
      />
      <IconButton
        iconIdentifier={IconIdentifier.ChevronSmallLeft}
        className="swipe-map-layers__action-btn right"
        onClick={onOpenRightSideCard}
      />

      {/* Left Layers Sidecard */}
      <SideCard
        showCloseButton={false}
        title="Iteration - Left Pane"
        placement={SideCardLocation.Start}
        onClose={onCloseLeftSideCard}
        show={showSideCard.left}
        backdrop={false}
        scroll={true}
        className="swipe-map-layers__sidecard"
      >
        <IconButton
          iconIdentifier={IconIdentifier.ChevronSmallLeft}
          className="swipe-map-layers__sidecard__action-btn left"
          onClick={onCloseLeftSideCard}
        />
        <InputGroup>
          <Input.Label>Select Iteration</Input.Label>
          <Input.Select
            placeholder="Select Iteration"
            options={leftSideCardIterations}
            value={selectedLeftIterationOption}
            isLoading={iterationsIsLoading}
            isDisabled={!siteId}
            onChange={onLeftIterationChange}
          />
        </InputGroup>
        {isLoadingLeftLayerList ? (
          <Spinner />
        ) : (
          <SwipeMapLayerList
            layers={leftLayers}
            setLayers={setLeftLayers}
            orthomosaicLayers={leftOrthomosaic}
            setOrthomosaicLayers={setLeftOrthomosaic}
          />
        )}
      </SideCard>
      {/* Right Layers Sidecard */}
      <SideCard
        showCloseButton={false}
        title="Iteration - Right Pane"
        placement={SideCardLocation.End}
        onClose={onCloseRightSideCard}
        show={showSideCard.right}
        backdrop={false}
        scroll={true}
        className="swipe-map-layers__sidecard"
      >
        <IconButton
          iconIdentifier={IconIdentifier.ChevronSmallRight}
          className="swipe-map-layers__sidecard__action-btn right"
          onClick={onCloseRightSideCard}
        />
        <InputGroup>
          <Input.Label>Select Iteration</Input.Label>
          <Input.Select
            placeholder="Select Iteration"
            options={rightSideCardIterations}
            value={selectedRightIterationOption}
            isLoading={iterationsIsLoading}
            isDisabled={!siteId}
            onChange={onRightIterationChange}
          />
        </InputGroup>
        {isLoadingRightLayerList ? (
          <Spinner />
        ) : (
          <SwipeMapLayerList
            layers={rightLayers}
            setLayers={setRightLayers}
            orthomosaicLayers={rightOrthomosaic}
            setOrthomosaicLayers={setRightOrthomosaic}
          />
        )}
      </SideCard>
    </div>
  );
};
