import { isNil } from 'lodash';
import { SimpleGeometry } from 'ol/geom';
import { Snap, Modify } from 'ol/interaction';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import Overlay from 'ol/Overlay';
import { MutableRefObject } from 'react';
import Map from 'ol/Map';
import { DrawingStyle } from '../enums';
import {
  yellowLineStyle,
  yellowPointStyle,
  yellowEditStyle,
  yellowPinStyle,
  blueLineStyle,
  blueYellowPointStyle,
  blueYellowEditStyle,
} from '../style-constants';
import { GCPData } from 'src/shared/api';
import { GCPType } from 'src/tasks/enums';

export const getFilteredGcpTypesList = (gcpPoints: GCPData[]) => {
  const taggedGcp: GCPData[] = [];
  const untaggedGcp: GCPData[] = [];
  const taggedCheckpoint: GCPData[] = [];
  const untaggedCheckpoint: GCPData[] = [];

  gcpPoints.forEach((gcpPoint) => {
    if (!isNil(gcpPoint.locationWgs84)) {
      if (gcpPoint.type === GCPType.CONTROLPOINT) {
        if (gcpPoint.numberOfImagesTagged > 0) {
          taggedGcp.push(gcpPoint);
        } else {
          untaggedGcp.push(gcpPoint);
        }
      } else if (gcpPoint.type === GCPType.CHECKPOINT) {
        if (gcpPoint.numberOfImagesTagged > 0) {
          taggedCheckpoint.push(gcpPoint);
        } else {
          untaggedCheckpoint.push(gcpPoint);
        }
      }
    }
  });
  return { taggedGcp, untaggedGcp, taggedCheckpoint, untaggedCheckpoint };
};

export const addOverlayPopups = (
  map,
  setOverlayPopupDetails,
  popupOverlayRef,
  popupElementRef,
) => {
  if (map && popupElementRef.current) {
    popupOverlayRef.current = new Overlay({
      element: popupElementRef.current,
      stopEvent: true,
    });
    map.addOverlay(popupOverlayRef.current);

    // Adding onClick properties.
    map.on('click', async (e) => {
      const feature = map.forEachFeatureAtPixel(e.pixel, (feature) => {
        return feature;
      });
      if (feature && feature.get('type')) {
        const featureGeometry = feature.getGeometry() as SimpleGeometry;
        const featureCoordinates = featureGeometry.getFlatCoordinates();
        setOverlayPopupDetails({
          popupType: feature.get('type'),
          name: feature.get('name'),
          id: feature.get('id'),
          latitude: featureCoordinates[0],
          longitude: featureCoordinates[1],
          altitude: featureCoordinates[2],
          showActionButton: feature.get('showActionButton'),
          onActionButtonClick: feature.get('onClick'),
        });
        popupOverlayRef.current?.setPosition(featureCoordinates);
      } else {
        // Removing popup outside Point click.
        popupOverlayRef.current?.setPosition(undefined);
      }
    });
  }
};

/**
/**
 * The function generates drawing tool styles:- 1. yellow variant and default 2. blue variant.
 * @param {DrawingStyle} drawingStyle - Enum representing styles for drawing tools.
 * @returns The function returns an object with line, point & edit styles as specified.
 */
export const generateDrawingToolStyles = (drawingStyle: DrawingStyle) => {
  if (drawingStyle === DrawingStyle.YellowVariant) {
    return {
      lineStyle: yellowLineStyle,
      pointStyle: yellowPointStyle,
      editStyle: yellowEditStyle,
    };
  }
  if (drawingStyle === DrawingStyle.YellowPin) {
    return {
      lineStyle: yellowLineStyle,
      pointStyle: yellowPinStyle,
      editStyle: yellowEditStyle,
    };
  }

  return {
    lineStyle: blueLineStyle,
    pointStyle: blueYellowPointStyle,
    editStyle: blueYellowEditStyle,
  };
};

/**
 * The function adds snap and modify interactions to a given layer on a
 * map object with a specified drawing style.
 * @param {Map} mapObject - It is a reference to the map object where the layer
 * will be added.
 * @param {layer} - It represents the layer to which you want to add editing interactions.
 * @param {DrawingStyle} drawingStyle - Enum representing styles for drawing tools.
 */
export const addEditInteractionsToLayer = (
  mapObject: Map,
  layer: WebGLPointsLayer<any> | VectorLayer<any> | TileLayer<any>,
  drawingStyle: DrawingStyle,
) => {
  const { pointStyle } = generateDrawingToolStyles(drawingStyle);
  const snap = new Snap({
    source: layer.getSource(),
    pixelTolerance: 10,
  });
  const modify = new Modify({
    source: layer.getSource(),
    style: [pointStyle],
  });
  mapObject.addInteraction(snap);
  mapObject.addInteraction(modify);
};

/**
 * The function creates a measure tooltip element and overlay for a map object.
 * @param measureTooltipElementRef - A mutable reference to the HTML element  for measure tooltip.
 * @param measureTooltipOverlayRef - A mutable reference to an Overlay instance used for displaying measurement tooltips on a map.
 * @param {Map} mapObject - An object that represents map on which layer is added.
 */
export const createMeasureTooltip = (
  measureTooltipElementRef: MutableRefObject<HTMLElement | null | undefined>,
  measureTooltipOverlayRef: MutableRefObject<Overlay | null | undefined>,
  mapObject: Map,
) => {
  measureTooltipElementRef.current = document.createElement('div');
  measureTooltipElementRef.current.className = 'ol-tooltip ol-tooltip-measure';
  measureTooltipOverlayRef.current = new Overlay({
    element: measureTooltipElementRef.current,
    offset: [0, -15],
    positioning: 'bottom-center',
    stopEvent: false,
    insertFirst: false,
  });

  if (measureTooltipOverlayRef.current) {
    measureTooltipOverlayRef.current.set('name', 'measure-layer');
    mapObject.addOverlay(measureTooltipOverlayRef.current);
  }
};
