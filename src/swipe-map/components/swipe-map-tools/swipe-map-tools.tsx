import { IconButton, IconIdentifier } from '@aus-platform/design-system';
import classNames from 'classnames';
import { isNull } from 'lodash';
import { Feature, Map, Overlay } from 'ol';
import { unByKey } from 'ol/Observable';
import { Geometry, LineString, Polygon } from 'ol/geom';
import { Draw } from 'ol/interaction';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import React, { useEffect, useRef, useState } from 'react';
import {
  formatArea,
  formatLength,
  styles,
} from '../../../shared/resources/openlayers';
import { MeasurementTool } from './enums';

import { SpotMeasurement } from './components';

type SwipeMapToolsProps = {
  map: Map;
  isLeftSideCardExpanded: boolean;
  mapRef: React.MutableRefObject<HTMLDivElement>;
};

export const SwipeMapTools: React.FC<SwipeMapToolsProps> = ({
  map,
  mapRef,
  isLeftSideCardExpanded,
}) => {
  // useRefs.
  const toolVectorLayer =
    useRef<VectorLayer<VectorSource<Feature<Geometry>>>>();
  const draw = useRef<Draw>();
  const sketch = useRef<Feature<Geometry> | null>();
  const measureTooltipElement = useRef<HTMLElement | null>();
  const measureTooltip = useRef<Overlay | null>();

  // States.
  const [selectedTool, setSelectedTool] = useState<MeasurementTool | null>(
    null,
  );
  const [isMeasurementToolExpanded, setIsMeasurementToolExpanded] =
    useState(false);

  // Constants.
  const swipeMapToolCustomClass = classNames([
    'swipe-map__tools',
    isLeftSideCardExpanded ? 'expanded' : '',
  ]);

  // Handlers.
  const activateTool = (tool: MeasurementTool) => {
    // Already activated tool is clicked again, so deactivate it.
    if (selectedTool === tool) {
      setSelectedTool(null);
    } else {
      setSelectedTool(tool);
      // Disable the previous tool and select the new tool.
      disableMeasurementTool();
      enableMeasurementTool(tool);
    }
  };

  const createMeasureTooltip = () => {
    removeMeasureTooltip();
    measureTooltipElement.current = document.createElement('div');
    measureTooltipElement.current.className = 'ol-tooltip ol-tooltip-measure';
    measureTooltip.current = new Overlay({
      element: measureTooltipElement.current,
      offset: [0, -15],
      positioning: 'bottom-center',
      stopEvent: false,
      insertFirst: false,
    });
    if (measureTooltip.current) {
      map?.addOverlay(measureTooltip.current);
    }
  };

  const enableMeasurementTool = (tool) => {
    if (tool === MeasurementTool.SpotMeasurementTool) {
      return;
    }

    toolVectorLayer.current = new VectorLayer({
      source: new VectorSource(),
      zIndex: 100,
      style: styles['ToolsVectorLayer'],
    });
    const source = toolVectorLayer.current.getSource();

    if (source) {
      map?.addLayer(toolVectorLayer.current);
      draw.current = new Draw({
        source,
        type: tool === MeasurementTool.DistanceTool ? 'LineString' : 'Polygon',
        style: styles['Measure'],
      });
      map?.addInteraction(draw.current);

      let listener;
      draw.current.on('drawstart', (evt: any) => {
        createMeasureTooltip();
        source.clear();
        sketch.current = evt.feature;

        let tooltipCoord = evt.coordinate;

        listener = sketch.current?.getGeometry()?.on('change', (evt: any) => {
          const geom = evt.target;
          let output;

          if (geom instanceof Polygon) {
            output = `Area: ${formatArea(geom)}<br> Perimeter: ${formatLength(
              geom,
            )}`;
            tooltipCoord = geom.getInteriorPoint().getCoordinates();
          } else if (geom instanceof LineString) {
            output = formatLength(geom);
            tooltipCoord = geom.getLastCoordinate();
          }

          if (measureTooltipElement && measureTooltipElement.current) {
            measureTooltipElement.current.innerHTML = output;
          }
          measureTooltip.current?.setPosition(tooltipCoord);
        });
      });

      draw.current.on('drawend', () => {
        if (measureTooltipElement && measureTooltipElement.current) {
          measureTooltipElement.current.className =
            'ol-tooltip ol-tooltip-static';
          measureTooltip.current?.setOffset([0, -7]);
          sketch.current = null;
          unByKey(listener);
        }
      });
    }
  };

  const disableMeasurementTool = () => {
    if (toolVectorLayer.current) {
      map?.removeLayer(toolVectorLayer.current);
    }

    if (draw.current) {
      map?.removeInteraction(draw.current);
    }

    removeMeasureTooltip();
  };

  const removeMeasureTooltip = () => {
    if (measureTooltipElement.current) {
      measureTooltipElement.current?.parentNode?.removeChild(
        measureTooltipElement.current,
      );
    }

    if (measureTooltip.current) {
      map?.removeOverlay(measureTooltip.current);
    }
  };

  const onClickMeasureTool = () => {
    if (!isMeasurementToolExpanded) {
      setSelectedTool(MeasurementTool.DistanceTool);
      activateTool(MeasurementTool.DistanceTool);
    } else {
      setSelectedTool(null);
    }
    setIsMeasurementToolExpanded(!isMeasurementToolExpanded);
  };

  // useEffects.
  // Remove geometries & disable measure tool when no tool is selected.
  useEffect(() => {
    if (isNull(selectedTool)) {
      disableMeasurementTool();
    }
  }, [selectedTool]);

  useEffect(() => {
    if (!mapRef) {
      return;
    }

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        disableMeasurementTool();
        enableMeasurementTool(selectedTool);
      }
    };

    if (isMeasurementToolExpanded) {
      mapRef?.current?.addEventListener('keyup', handleEscKey);
    }

    return () => {
      if (mapRef && mapRef.current) {
        mapRef.current.removeEventListener('keyup', handleEscKey);
      }
    };
  }, [isMeasurementToolExpanded, selectedTool, mapRef]);

  return (
    <div className={swipeMapToolCustomClass}>
      <div className="swipe-map__tools-container">
        <IconButton
          iconIdentifier={IconIdentifier.Measure}
          className="swipe-map__measurement-tool"
          isActive={isMeasurementToolExpanded}
          onClick={onClickMeasureTool}
        />
        {isMeasurementToolExpanded && (
          <div className="swipe-map__tools-expanded-container">
            <IconButton
              iconIdentifier={IconIdentifier.Line}
              isActive={selectedTool === MeasurementTool.DistanceTool}
              onClick={() => activateTool(MeasurementTool.DistanceTool)}
            />
            <IconButton
              iconIdentifier={IconIdentifier.Polygon}
              isActive={selectedTool === MeasurementTool.AreaPerimeterTool}
              onClick={() => activateTool(MeasurementTool.AreaPerimeterTool)}
            />
            <IconButton
              iconIdentifier={IconIdentifier.Point}
              isActive={selectedTool === MeasurementTool.SpotMeasurementTool}
              onClick={() => activateTool(MeasurementTool.SpotMeasurementTool)}
            />
          </div>
        )}
      </div>

      {selectedTool === MeasurementTool.SpotMeasurementTool && (
        <SpotMeasurement map={map} />
      )}
    </div>
  );
};
