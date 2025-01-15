import {
  Fab,
  IconIdentifier,
  Placement,
  Spinner,
  Tooltip,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isEmpty, isNil } from 'lodash';
import { useEffect, useState } from 'react';
import { selectSwipeMap3D } from '../swipe-map-3d-slice';
import { SwipeMap3DMeasureTool, SwipeMap3DSpotInfo } from './types';
import { SpotValidationMessage, spotInfoInitialState } from './constants';
import { useAppSelector } from 'app/hooks';
import {
  InfoTool,
  InfoToolEvent,
  LineTool,
  MeasureTool,
  PolygonTool,
} from 'map-3d/shared';
import { useAltitude } from 'shared/api';
import { FixedLengthArray } from 'src/shared/type-utils';

export const SwipeMap3DMeasurementTool = () => {
  // Selectors.
  const { isLeftSidecardOpen, splitViewer, leftIteration, rightIteration } =
    useAppSelector(selectSwipeMap3D);

  // States.
  const [isMeasurementToolExpanded, setIsMeasurementToolExpanded] =
    useState(false);
  const [measureTool, setMeasureTool] = useState<SwipeMap3DMeasureTool>();
  const [isSpotToolActive, setIsSpotToolActive] = useState(false);
  const [spotInfo, setSpotInfo] =
    useState<SwipeMap3DSpotInfo>(spotInfoInitialState);

  // Constants.
  const containerClassname = classNames(
    'swipe-map-3d-measurement-tool-container',
    { 'move-by-left-sidecard': isLeftSidecardOpen },
  );

  const iterationIds = [leftIteration?.id, rightIteration?.id].filter(
    (id) => !isNil(id),
  );

  // Apis.
  const {
    data: altitudeResponse,
    isSuccess: isSuccessAltitude,
    refetch: fetchAltitude,
    isRefetching: isRefetchingAltitude,
    isLoading: isLoadingAltitude,
  } = useAltitude(
    {
      latitude: Number(spotInfo.latitude),
      longitude: Number(spotInfo.longitude),
      iterations: iterationIds,
    },
    false,
  );

  const isAltitudeLoading = isLoadingAltitude || isRefetchingAltitude;

  // Handlers.
  const resetMeasurementTool = () => {
    measureTool?.leftInstance.deactivateInfoTool();
    measureTool?.rightInstance.deactivateInfoTool();
    setSpotInfo(spotInfoInitialState);
    setIsSpotToolActive(false);
  };

  const onClickMeasurementTool = () => {
    // Deactivate active measure tools when disabling measure tools.
    if (isMeasurementToolExpanded) {
      resetMeasurementTool();
    }

    setIsMeasurementToolExpanded(!isMeasurementToolExpanded);
  };

  const onClickInfoTool = () => {
    if (isSpotToolActive) {
      measureTool?.leftInstance.deactivateInfoTool();
      measureTool?.rightInstance.deactivateInfoTool();
      setSpotInfo(spotInfoInitialState);
    } else {
      measureTool?.rightInstance.activateInfoTool();
      measureTool?.leftInstance.activateInfoTool();
    }

    setIsSpotToolActive(!isSpotToolActive);
  };

  const getAltitude = (
    altitudeData: Record<string, number | null>,
    iteration?: { id: string } | null,
  ): string => {
    if (!iteration) {
      return SpotValidationMessage.ItrNotSelected;
    }

    const altitude = altitudeData[iteration.id];

    return altitude ? altitude.toFixed(6) : SpotValidationMessage.OutOfBounds;
  };

  const spotClickListener = ([latitude, longitude]: FixedLengthArray<
    number,
    2
  >) => {
    setSpotInfo({
      ...spotInfo,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    });
  };

  // useEffects.
  useEffect(() => {
    // Only create an instance when the measure tools options are expanded.
    if (!splitViewer?.viewerLeft || !splitViewer?.viewerRight) {
      return;
    }

    const { viewerLeft, viewerRight } = splitViewer;

    const measureToolLeftInstance = new MeasureTool(
      new InfoTool(viewerLeft),
      new LineTool(viewerLeft),
      new PolygonTool(viewerLeft),
    );

    const measureToolRightInstance = new MeasureTool(
      new InfoTool(viewerRight),
      new LineTool(viewerRight),
      new PolygonTool(viewerRight),
    );

    setMeasureTool({
      leftInstance: measureToolLeftInstance,
      rightInstance: measureToolRightInstance,
    });

    measureToolLeftInstance.infoTool.addEventListener(
      InfoToolEvent.LeftClick,
      spotClickListener,
    );

    measureToolRightInstance.infoTool.addEventListener(
      InfoToolEvent.LeftClick,
      spotClickListener,
    );

    return () => {
      resetMeasurementTool();
      measureToolLeftInstance.infoTool.removeEventListener(
        InfoToolEvent.LeftClick,
        spotClickListener,
      );

      measureToolRightInstance.infoTool.removeEventListener(
        InfoToolEvent.LeftClick,
        spotClickListener,
      );
    };
  }, [splitViewer]);

  useEffect(() => {
    if (isSuccessAltitude && altitudeResponse) {
      const leftAltitude = getAltitude(
        altitudeResponse.data.altitudes,
        leftIteration,
      );

      const rightAltitude = getAltitude(
        altitudeResponse.data.altitudes,
        rightIteration,
      );

      setSpotInfo({
        ...spotInfo,
        leftIterationAltitude: leftAltitude,
        rightIterationAltitude: rightAltitude,
      });
    }
  }, [altitudeResponse, isSuccessAltitude]);

  useEffect(() => {
    if (!isEmpty(iterationIds) && spotInfo.latitude && spotInfo.longitude) {
      fetchAltitude();
    }
  }, [spotInfo.latitude, spotInfo.longitude, rightIteration, leftIteration]);

  return (
    <div className={containerClassname}>
      <div className="swipe-map-3d-measurement-tool">
        <Tooltip hoverText="Measure" placement={Placement.Right}>
          <Fab
            leftIconIdentifier={IconIdentifier.Measure}
            onClick={onClickMeasurementTool}
            active={isMeasurementToolExpanded}
          />
        </Tooltip>
        {isMeasurementToolExpanded && (
          <Tooltip hoverText="Point" placement={Placement.Bottom}>
            <Fab
              leftIconIdentifier={IconIdentifier.Point}
              onClick={onClickInfoTool}
              active={isSpotToolActive}
            />
          </Tooltip>
        )}
      </div>
      {isSpotToolActive && (
        <div className="swipe-map-3d-measurement-tool__spot-info">
          <div className="swipe-map-3d-measurement-tool__spot-info__group">
            <span>Latitude: </span>
            <strong>{spotInfo.latitude}</strong>
          </div>
          <div className="swipe-map-3d-measurement-tool__spot-info__group">
            <span>Longitude: </span>
            <strong>{spotInfo.longitude}</strong>
          </div>
          <div className="swipe-map-3d-measurement-tool__spot-info__group">
            <span>(L) ITR- Altitude (m): </span>
            <strong>
              {isAltitudeLoading ? <Spinner /> : spotInfo.leftIterationAltitude}
            </strong>
          </div>
          <div className="swipe-map-3d-measurement-tool__spot-info__group">
            <span>(R) ITR- Altitude (m): </span>
            <strong>
              {isAltitudeLoading ? (
                <Spinner />
              ) : (
                spotInfo.rightIterationAltitude
              )}
            </strong>
          </div>
        </div>
      )}
    </div>
  );
};
