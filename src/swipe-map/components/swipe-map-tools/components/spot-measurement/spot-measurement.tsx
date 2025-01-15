import React, { useEffect, useState } from 'react';
import { transform } from 'ol/proj';
import { Map } from 'ol';
import { isNil, round } from 'lodash';
import { useAppSelector } from '../../../../../app/hooks';
import { selectSwipeMapDataset } from '../../../../swipe-map-slices';
import {
  handleResponseErrorMessage,
  useAltitude,
} from '../../../../../shared/api';
import { EpsgValue } from '../../../../../shared/enums';
import { SpotInfoState } from './types';
import { SpotAltitudeText } from './spot-altitude';

type SpotMeasurementProps = {
  map: Map;
};

const spotInfoInitialState: SpotInfoState = {
  longitude: null,
  latitude: null,
  leftIterationAltitude: null,
  rightIterationAltitude: null,
};

export const SpotMeasurement: React.FC<SpotMeasurementProps> = ({ map }) => {
  // Selectors
  const { leftIteration, rightIteration } = useAppSelector(
    selectSwipeMapDataset,
  );

  // State.
  const [spotInfo, setSpotInfo] = useState<SpotInfoState>(spotInfoInitialState);

  // Variables.
  const areCoordinatesSelected =
    !isNil(spotInfo.latitude) && !isNil(spotInfo.longitude);

  const isAnyIterationSelected =
    !isNil(leftIteration) || !isNil(rightIteration);

  const shouldFetchAltitude = isAnyIterationSelected && areCoordinatesSelected;

  // APIs.
  const {
    data: altitudeResponse,
    isSuccess,
    isError,
    error,
    isFetching: isFetchingAltitude,
  } = useAltitude(
    {
      iterations: [leftIteration?.id, rightIteration?.id],
      longitude: spotInfo.longitude ?? undefined,
      latitude: spotInfo.latitude ?? undefined,
    },
    shouldFetchAltitude,
  );

  // useEffects.
  useEffect(() => {
    const onMapClick = (evt) => {
      const coordinate = transform(
        evt.coordinate,
        EpsgValue.PseudoMercator,
        EpsgValue.WGS84,
      );
      const latitude = Number(coordinate[1].toFixed(6));
      const longitude = Number(coordinate[0].toFixed(6));

      setSpotInfo((currentState) => {
        if (
          currentState.latitude === latitude &&
          currentState.longitude === longitude
        ) {
          return currentState;
        }

        return {
          ...spotInfoInitialState,
          latitude,
          longitude,
        };
      });
    };

    map.addEventListener('click', onMapClick);

    // Change cursor to crosshair.
    const targetElement = map.getTarget();

    if (targetElement instanceof HTMLElement) {
      targetElement.style.cursor = 'crosshair';
    }

    return () => {
      map.removeEventListener('click', onMapClick);

      // Change cursor to default.
      if (targetElement instanceof HTMLElement) {
        targetElement.style.cursor = 'default';
      }
    };
  }, []);

  useEffect(() => {
    if (isSuccess && altitudeResponse.data) {
      const altitudes = altitudeResponse.data.altitudes;

      const leftIterationAltitude = leftIteration
        ? altitudes[leftIteration.id]
        : null;
      const rightIterationAltitude = rightIteration
        ? altitudes[rightIteration.id]
        : null;

      setSpotInfo((prev) => ({
        ...prev,
        leftIterationAltitude: leftIterationAltitude
          ? round(leftIterationAltitude, 6)
          : null,
        rightIterationAltitude: rightIterationAltitude
          ? round(rightIterationAltitude, 6)
          : null,
      }));
    }
    handleResponseErrorMessage(isError, error);
  }, [isSuccess, isError]);

  return (
    <div className="swipe-map-spot-measurement-info-box">
      <span className="swipe-map-spot-measurement-info-box__info">
        Latitude <span>{spotInfo.latitude}</span>
      </span>
      <span className="swipe-map-spot-measurement-info-box__info">
        Longitude <span>{spotInfo.longitude}</span>
      </span>
      <span className="swipe-map-spot-measurement-info-box__info">
        (L) ITR- Altitude (m)
        <span>
          {areCoordinatesSelected && (
            <SpotAltitudeText
              isLoading={isFetchingAltitude}
              iteration={leftIteration}
              altitude={spotInfo.leftIterationAltitude}
            />
          )}
        </span>
      </span>
      <span className="swipe-map-spot-measurement-info-box__info">
        (R) ITR- Altitude (m)
        <span>
          {areCoordinatesSelected && (
            <SpotAltitudeText
              isLoading={isFetchingAltitude}
              iteration={rightIteration}
              altitude={spotInfo.rightIterationAltitude}
            />
          )}
        </span>
      </span>
    </div>
  );
};
