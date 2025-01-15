import { Line, Polygon } from '@aus-platform/cesium';
import {
  Fab,
  FabOrientation,
  FabStack,
  IconIdentifier,
  Placement,
  Spinner,
  Tooltip,
} from '@aus-platform/design-system';
import { capitalize, isEmpty, isNil } from 'lodash';
import { useEffect, useState } from 'react';
import {
  destroyFeatureInfoTool,
  destroyMeasureTool,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
} from '../../../../shared/map-3d-slices';
import {
  InfoTool,
  InfoToolEvent,
  LineEventType,
  LineTool,
  MeasureTool,
  PolygonEventType,
  PolygonTool,
} from '../../../../shared/map-3d-tools';
import { IMeasureTool } from '../../../../shared/map-3d-tools/interfaces';
import { MapTool } from '../enums';
import { SpotInfoState } from './types';
import { useAltitude } from 'shared/api';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import { BatchJobStatus } from 'shared/enums';

const measurementToolsList = [
  IconIdentifier.Line,
  IconIdentifier.Polygon,
  IconIdentifier.Point,
];

const spotInfoInitialState: SpotInfoState = {
  longitude: null,
  latitude: null,
  altitude: null,
};

export const Map3dMeasurementTool = () => {
  // States.
  const [currentMeasureTool, setCurrentMeasureTool] =
    useState<IconIdentifier | null>(null);
  const [measureTool, setMeasureTool] = useState<IMeasureTool>();
  const [spotInfo, setSpotInfo] = useState<SpotInfoState>(spotInfoInitialState);

  // Hooks.
  const dispatch = useAppDispatch();

  // Selectors.
  const { cesiumProxy, currentActiveMapTool } =
    useAppSelector(selectMap3DState);
  const { selectedTerrainIteration } = useAppSelector(selectMap3dDataset);
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);

  // Api.
  const {
    data: altitudeResponse,
    isSuccess,
    isError,
    refetch: fetchAltitude,
    isFetching,
  } = useAltitude(
    {
      iterations: [selectedTerrainIteration?.id],
      longitude: measureTool?.infoTool.info.longitude,
      latitude: measureTool?.infoTool.info.latitude,
    },
    false,
  );

  // useEffects.
  useEffect(() => {
    // Only create an instance when the measure tools options are expanded.
    if (currentActiveMapTool === MapTool.MeasureTool && !isNil(cesiumProxy)) {
      const newMeasureTool = new MeasureTool(
        new InfoTool(cesiumProxy.cesiumViewer),
        new LineTool(cesiumProxy.cesiumViewer),
        new PolygonTool(cesiumProxy.cesiumViewer),
      );

      setMeasureTool(newMeasureTool);
    } else if (
      !isNil(measureTool) &&
      currentActiveMapTool !== MapTool.MeasureTool
    ) {
      removeAllEvents();
      setCurrentMeasureTool(null);
      measureTool.deactivateMeasureTool();
      dispatch(destroyMeasureTool());
      setSpotInfo(spotInfoInitialState);
    }
  }, [currentActiveMapTool]);

  // UseEffect to activate line tool by default.
  useEffect(() => {
    if (measureTool) {
      onToolBtnClick(IconIdentifier.Line);
    }
  }, [measureTool]);

  useEffect(() => {
    const spotClickListener = ([latitude, longitude]) => {
      // HOTFIX: Removing altitudes as cesium return negative value for spots outside of terrain.
      setSpotInfo((prev) => ({
        ...prev,
        longitude: longitude.toString(),
        latitude: latitude.toString(),
      }));
    };

    if (currentMeasureTool) {
      measureTool?.polygonTool.addEventListener(
        PolygonEventType.PolygonCreated,
        listenerPolygonCreated,
      );

      measureTool?.lineTool.addEventListener(
        LineEventType.LineCreated,
        listenerLineCreated,
      );

      measureTool?.infoTool.addEventListener(
        InfoToolEvent.LeftClick,
        spotClickListener,
      );
    }
    return () => {
      removeCreateEvents();
      measureTool?.infoTool.removeEventListener(
        InfoToolEvent.LeftClick,
        spotClickListener,
      );
      setSpotInfo(spotInfoInitialState);
    };
  }, [currentMeasureTool]);

  useEffect(() => {
    // HOTFIX: Make request when spot coordinate changes as cesium is returning wrong value for spots outside of DSM.
    if (
      spotInfo.latitude &&
      spotInfo.longitude &&
      selectedTerrainIteration?.id &&
      selectedTerrainIteration.capturedDsmCog?.batchJob.status ===
        BatchJobStatus.Completed
    ) {
      fetchAltitude();
    }
  }, [spotInfo.latitude, spotInfo.longitude]);

  useEffect(() => {
    if (!isSuccess || !altitudeResponse.data) {
      return;
    }

    if (measureTool?.infoTool && !isNil(selectedTerrainIteration?.id)) {
      const altitude =
        altitudeResponse.data.altitudes[selectedTerrainIteration.id];

      measureTool.infoTool.altitude = altitude ?? undefined;

      setSpotInfo((prev) => ({
        ...prev,
        altitude: altitude?.toFixed(6).toString() ?? '',
      }));
    }
  }, [isSuccess, altitudeResponse]);

  useEffect(() => {
    if (isError) {
      setSpotInfo((prev) => ({
        ...prev,
        altitude: '',
      }));
    }
  }, [isError]);

  useEffect(() => {
    return () => {
      dispatch(setCurrentActiveMapTool(MapTool.None));
    };
  }, []);

  // Listeners.
  const listenerPolygonCreated = (polygon: Polygon[]) => {
    if (!isEmpty(polygon) && !isNil(measureTool) && currentMeasureTool) {
      measureTool.polygonDrawingEnded();
      measureTool.setPolygon(polygon[0]);
      measureTool.initiatePolygonMeasurement(polygon[0]);

      // Disable tool after the measure is complete.
      currentMeasureTool && toggleToolOptions(currentMeasureTool);
      measureTool?.eventPolygonEditing();
    }
  };

  const listenerLineCreated = (line: Line[]) => {
    if (!isEmpty(line) && !isNil(measureTool) && currentMeasureTool) {
      measureTool.lineDrawingEnded();
      measureTool.setLine(line[0]);
      measureTool.initiateLineMeasurement(line[0]);

      if (currentMeasureTool) {
        // Disable tool after the measure is complete.
        toggleToolOptions(currentMeasureTool);
      }

      measureTool.eventLineEditing();
    }
  };

  // Handlers.
  const removeAllEvents = () => {
    removeCreateEvents();
    measureTool?.eventRemoveModifyGeometry();
    measureTool?.deleteAllCurrentDrawnGeometries();
  };

  const removeCreateEvents = () => {
    measureTool?.polygonTool.removeEventListener(
      PolygonEventType.PolygonCreated,
      listenerPolygonCreated,
    );

    measureTool?.lineTool.lineTool.lineDrawing.eventLineCreated.removeEventListener(
      listenerLineCreated,
    );
  };

  const handleExpandMeasureToolOptions = () => {
    if (currentActiveMapTool === MapTool.FeatureTool) {
      destroyFeatureInfoTool();
    }

    if (
      !measureTool?.drawingIsActive &&
      currentActiveMapTool !== MapTool.MeasureTool
    ) {
      dispatch(setCurrentActiveMapTool(MapTool.MeasureTool));
    } else if (currentActiveMapTool === MapTool.MeasureTool) {
      // Remove and deactivate measure-tool polygon and line if user
      // click on measure tool while in drawing mode.
      measureTool?.resetCurrentDrawing();
      setCurrentMeasureTool(null);
      dispatch(setCurrentActiveMapTool(MapTool.None));
    }
  };

  const toggleToolOptions = (iconIdentifier: IconIdentifier) => {
    if (iconIdentifier === currentMeasureTool) {
      setCurrentMeasureTool(null);
    } else {
      setCurrentMeasureTool(iconIdentifier);
    }
  };

  const onToolBtnClick = (identifier: IconIdentifier) => {
    drawingTools?.deactivateAllTools();

    switch (identifier) {
      case IconIdentifier.Polygon:
        if (currentMeasureTool !== identifier) {
          measureTool?.deleteAllCurrentDrawnGeometries();
          measureTool?.activatePolygonDrawing();
          measureTool?.deactivateInfoTool();
        }
        break;
      case IconIdentifier.Line:
        measureTool?.deleteAllCurrentDrawnGeometries();
        measureTool?.activateLineDrawing();
        measureTool?.deactivateInfoTool();
        break;
      case IconIdentifier.Point:
        measureTool?.deleteAllCurrentDrawnGeometries();
        measureTool?.activateInfoTool();
        break;
    }

    toggleToolOptions(identifier);
    measureTool?.resetCurrentDrawing();
  };

  // Renders.
  return (
    <div className="map-3d-tools map-3d-tools--measure-tool">
      <Tooltip hoverText="Measure" placement={Placement.Right}>
        <Fab
          leftIconIdentifier={IconIdentifier.Measure}
          onClick={handleExpandMeasureToolOptions}
          active={currentActiveMapTool === MapTool.MeasureTool}
          data-testid="measurement-tools-menu-icon-button"
        />
      </Tooltip>

      {currentActiveMapTool === MapTool.MeasureTool && (
        <FabStack orientation={FabOrientation.Horizontal}>
          {measurementToolsList.map((tool, index) => (
            <Tooltip
              key={index}
              hoverText={capitalize(tool)}
              placement={Placement.Bottom}
            >
              <Fab
                leftIconIdentifier={tool}
                active={currentMeasureTool === tool}
                onClick={() => onToolBtnClick(tool)}
                data-testid={`measure-tool-${tool}-button`}
                className={`${tool}`}
              />
            </Tooltip>
          ))}
        </FabStack>
      )}
      {currentMeasureTool === IconIdentifier.Point && (
        <div className="spot-measurement-box">
          <span className="spot-measurement-box__info">
            Latitude{' '}
            <span data-testid="spot-measurement-latitude">
              {spotInfo.latitude}
            </span>
          </span>
          <span className="spot-measurement-box__info">
            Longitude{' '}
            <span data-testid="spot-measurement-longitude">
              {spotInfo.longitude}
            </span>
          </span>
          <span className="spot-measurement-box__info">
            Altitude (m)
            <span data-testid="spot-measurement-altitude">
              {isFetching ? (
                <Spinner />
              ) : isNil(selectedTerrainIteration) ? (
                'No terrain selected'
              ) : spotInfo.altitude === '' ? (
                'Out of Bounds'
              ) : (
                spotInfo.altitude
              )}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};
