import React from 'react';

import { Map } from 'ol';
import {
  DragRotateAndZoom,
  defaults as defaultInteractions,
} from 'ol/interaction';

import View from 'ol/View';
import { Tile as TileLayer } from 'ol/layer';
import { XYZ } from 'ol/source';
import { horizontalCRSMapping } from 'src/shared/constants';

const baseGoogleMapUrl =
  'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga';

export const baseMapLayer = new TileLayer({
  visible: true,
  opacity: 1.0,
  source: new XYZ({
    url: baseGoogleMapUrl,
  }),
});

export const createBaseMapObject = (
  mapRenderRef: React.RefObject<HTMLDivElement>,
) => {
  const mapOptions = {
    interactions: defaultInteractions().extend([new DragRotateAndZoom()]),
    view: new View({
      projection: horizontalCRSMapping.WGS_84,
      center: [0, 0],
      zoom: 2,
    }),
    layers: [],
  };
  const mapObject = new Map(mapOptions);

  if (mapRenderRef.current) {
    mapObject.setTarget(mapRenderRef.current);
  }
  return mapObject;
};
