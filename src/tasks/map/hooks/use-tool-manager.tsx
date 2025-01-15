import { Feature, Map, Overlay } from 'ol';
import { Coordinate } from 'ol/coordinate';
import { Geometry, LineString, Polygon } from 'ol/geom';
import Draw, { DrawEvent } from 'ol/interaction/Draw';
import { Vector as VectorLayer } from 'ol/layer';
import { unByKey } from 'ol/Observable';
import VectorSource from 'ol/source/Vector';
import { useCallback, useEffect, useRef, useState } from 'react';
import { InspectTool, MeasureTools, ReferenceLayerTool } from '../components';
import { defaultMeasureLayer } from '../constants';
import { CursorStyle } from '../enums';
import { generateDrawingToolStyles } from '../helpers';
import {
  MapMeasureInteraction,
  ToolType,
  UseMapMeasureToolsProps,
  ViewLayer,
} from '../types';
import { getPointAltitude } from 'src/shared/api';
import { formatArea, formatLength } from 'src/shared/resources/openlayers';

const createMeasureTooltip = (
  measureTooltipElementRef: React.MutableRefObject<HTMLElement | undefined>,
  measureTooltipOverlayRef: React.MutableRefObject<Overlay | undefined>,
  map: Map,
) => {
  const measureTooltipElement = document.createElement('div');
  measureTooltipElement.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltipElementRef.current = measureTooltipElement;

  const tooltip = new Overlay({
    element: measureTooltipElement,
    offset: [0, -15],
    positioning: 'bottom-center',
  });
  measureTooltipOverlayRef.current = tooltip;
  map.addOverlay(tooltip);
};

const createViewLayer = (options: {
  type: string;
  visible: boolean;
  isExtent: boolean;
  zIndex: number;
  extent?: number[];
}): ViewLayer => {
  const layer = new VectorLayer({
    source: new VectorSource({}),
    zIndex: options.zIndex,
  });
  layer.setVisible(options.visible);
  return {
    layer,
    visible: options.visible,
    isExtent: options.isExtent,
    extent: options.extent,
  };
};

export const useMapMeasureTools = ({
  setCursorStyle,
  map,
  measureLayersConfig = defaultMeasureLayer,
}: UseMapMeasureToolsProps) => {
  const [activeTool, setActiveTool] = useState<ToolType>('none');
  const isInspectToolActiveRef = useRef(false);
  const measureTooltipElementRef = useRef<HTMLElement>();
  const measureTooltipOverlayRef = useRef<Overlay>();
  const [mapMeasureInteraction, setMapMeasureInteraction] =
    useState<MapMeasureInteraction>();
  const [toolsToggleState, setToolsToggleState] = useState<
    Record<string, boolean>
  >({});
  const inputRef = useRef<HTMLInputElement>(null);

  const [inspectState, setInspectState] = useState({
    latitude: '',
    longitude: '',
    altitude: '',
  });

  const [referenceLayer] = useState<ViewLayer>(() =>
    createViewLayer({
      type: 'ReferenceLayer',
      visible: false,
      isExtent: false,
      zIndex: 1,
    }),
  );

  // Unified disable function for all tools
  const disableAllTools = useCallback(() => {
    // Disable inspect tool
    isInspectToolActiveRef.current = false;
    setInspectState({ latitude: '', longitude: '', altitude: '' });

    // Disable measure tools
    if (mapMeasureInteraction) {
      Object.values(mapMeasureInteraction).forEach((obj) => {
        obj.source.clear();
        obj.draw.setActive(false);
      });
      setToolsToggleState({});
      if (measureTooltipElementRef.current) {
        measureTooltipElementRef.current.parentNode?.removeChild(
          measureTooltipElementRef.current,
        );
        measureTooltipElementRef.current = undefined;
      }
      if (measureTooltipOverlayRef.current && map) {
        map.removeOverlay(measureTooltipOverlayRef.current);
        measureTooltipOverlayRef.current = undefined;
      }
    }

    // Disable reference tool
    if (referenceLayer) {
      referenceLayer.layer.getSource()?.clear();
      referenceLayer.layer.setVisible(false);
    }

    setCursorStyle(CursorStyle.Auto);
    clearMeasureInteractions();
    setActiveTool('none');
  }, [map, mapMeasureInteraction, referenceLayer]);

  // Tool-specific handlers
  const handleInspectToolClick = useCallback(() => {
    if (activeTool === 'inspect') {
      disableAllTools();
    } else {
      disableAllTools();
      isInspectToolActiveRef.current = true;
      setActiveTool('inspect');
      setCursorStyle(CursorStyle.CrossHair);
    }
  }, [activeTool, disableAllTools]);

  const handleMeasureToolClick = useCallback(() => {
    if (activeTool === 'measure') {
      disableAllTools();
    } else {
      disableAllTools();
      setActiveTool('measure');
    }
  }, [activeTool, disableAllTools]);

  const handleReferenceToolClick = useCallback(() => {
    if (activeTool === 'reference') {
      disableAllTools();
    } else {
      disableAllTools();
      setActiveTool('reference');
      inputRef.current?.click();
    }
  }, [activeTool, disableAllTools]);

  const clearMeasureTooltips = (map: Map) => {
    // Remove all tooltip elements from DOM
    const tooltips = document.querySelectorAll('.ol-tooltip');
    tooltips.forEach((tooltip) => tooltip.remove());

    // Remove all overlays from map
    map.getOverlays().clear();
  };

  const clearMeasureInteractions = useCallback(() => {
    if (!mapMeasureInteraction || !map) {
      return;
    }
    Object.values(mapMeasureInteraction).forEach((obj) => {
      obj.source.clear();
      obj.draw.setActive(false);
    });
    clearMeasureTooltips(map);

    setToolsToggleState({});
  }, [map, mapMeasureInteraction]);

  // Measure tool initialization
  useEffect(() => {
    if (map && activeTool === 'measure' && !mapMeasureInteraction) {
      const measureObjects: MapMeasureInteraction = {};

      measureLayersConfig.forEach((measureLayer) => {
        const { type, tool, viewStyleType, drawStyleType } = measureLayer;
        const { lineStyle, pointStyle } =
          generateDrawingToolStyles(viewStyleType);
        const measureSource = new VectorSource({});
        const measureSourceVectorLayer = new VectorLayer({
          source: measureSource,
          style: [lineStyle, pointStyle],
        });

        const measureObject = new Draw({
          source: measureSource,
          style: drawStyleType,
          type: tool as any,
          geometryLayout: 'XYZ',
        });

        let listener;
        measureObject.on('drawstart', (event: DrawEvent) => {
          setCursorStyle(CursorStyle.CrossHair);
          const feature: Feature<Geometry> = event.feature;
          let tooltipCoord: Coordinate | undefined;

          createMeasureTooltip(
            measureTooltipElementRef,
            measureTooltipOverlayRef,
            map,
          );

          listener = feature.getGeometry()?.on('change', (evt) => {
            const geom = evt.target;
            let output;
            if (geom instanceof Polygon) {
              output = formatArea(geom);
              tooltipCoord = geom.getInteriorPoint().getCoordinates();
            }
            if (geom instanceof LineString) {
              output = formatLength(geom);
              tooltipCoord = geom.getLastCoordinate();
            }
            if (measureTooltipElementRef.current) {
              measureTooltipElementRef.current.textContent = output;
            }
            if (measureTooltipOverlayRef.current) {
              measureTooltipOverlayRef.current.setPosition(tooltipCoord);
            }
          });
        });

        measureObject.on('drawend', () => {
          setCursorStyle(CursorStyle.Auto);
          if (measureTooltipElementRef.current) {
            measureTooltipElementRef.current.className =
              'ol-tooltip ol-tooltip-static';
          }
          measureTooltipOverlayRef.current?.setOffset([0, -7]);
          unByKey(listener);
        });

        measureObject.setActive(false);
        map.addLayer(measureSourceVectorLayer);
        map.addInteraction(measureObject);

        measureObjects[type] = {
          draw: measureObject,
          source: measureSource,
          measureOverlayRef: measureTooltipOverlayRef,
          measureTooltipRef: measureTooltipElementRef,
        };
      });

      setMapMeasureInteraction(measureObjects);
      setToolsToggleState({});
    }
  }, [activeTool, map, measureLayersConfig]);

  // Render.
  const renderAllTools = useCallback(
    () => (
      <div className="map-tools">
        <MeasureTools
          activeTool={activeTool}
          handleMeasureToolClick={handleMeasureToolClick}
          measureLayersConfig={measureLayersConfig}
          toolsToggleState={toolsToggleState}
          mapMeasureInteraction={mapMeasureInteraction}
          clearMeasureInteractions={clearMeasureInteractions}
          setToolsToggleState={setToolsToggleState}
        />
        <ReferenceLayerTool
          handleReferenceToolClick={handleReferenceToolClick}
          inputRef={inputRef}
          referenceLayer={referenceLayer}
        />
        <InspectTool
          activeTool={activeTool}
          handleInspectToolClick={handleInspectToolClick}
          inspectState={inspectState}
        />
      </div>
    ),
    [
      activeTool,
      handleInspectToolClick,
      inspectState,
      handleMeasureToolClick,
      measureLayersConfig,
      toolsToggleState,
      mapMeasureInteraction,
      clearMeasureInteractions,
      setToolsToggleState,
      handleReferenceToolClick,
      inputRef,
      referenceLayer,
    ],
  );

  const updateInspectToolState = useCallback(
    async (event, demS3ObjectKey: string) => {
      if (isInspectToolActiveRef.current) {
        const x = event.coordinate[0].toFixed(6);
        const y = event.coordinate[1].toFixed(6);
        setInspectState({
          latitude: y,
          longitude: x,
          altitude: '',
        });
        if (demS3ObjectKey) {
          const z = await getPointAltitude(x, y, demS3ObjectKey);
          if (z) {
            setInspectState((prev) => ({ ...prev, altitude: z.toFixed(6) }));
          }
        }
      }
    },
    [],
  );

  return {
    activeTool,
    setActiveTool,
    renderAllTools,
    disableAllTools,
    updateInspectToolState,
    referenceLayer,
  };
};
