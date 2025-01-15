import { Map } from 'ol';
import { easeIn, easeOut } from 'ol/easing';
import { fromLonLat } from 'ol/proj';
import { Coordinate } from '../types';

export const panAndZoomCameraView = (map: Map, coordinate: Coordinate) => {
  const currentCenterPoint = map.getView().getCenter();
  const coordinateInEPSG3857 = fromLonLat([
    coordinate.longitude,
    coordinate.latitude,
  ]);
  if (currentCenterPoint && currentCenterPoint[0] != 0) {
    map?.getView().animate(
      {
        center: [
          (coordinateInEPSG3857[0] + currentCenterPoint[0]) / 2,
          (coordinateInEPSG3857[1] + currentCenterPoint[1]) / 2,
        ],
        zoom: 10,
        duration: 1000,
        easing: easeIn,
      },
      {
        center: coordinateInEPSG3857,
        duration: 1000,
        zoom: 15,
        easing: easeOut,
      },
    );
  } else {
    map?.getView().animate({
      center: coordinateInEPSG3857,
      duration: 1000,
      zoom: 15,
      easing: easeOut,
    });
  }
};

export const zoomIn = (map: Map) => {
  const currentZoom = map.getView().getZoom();
  if (currentZoom) {
    map?.getView().animate({
      zoom: currentZoom + 1,
      duration: 250,
    });
  }
};

export const zoomOut = (map: Map) => {
  const currentZoom = map.getView().getZoom();
  if (currentZoom && currentZoom >= 3) {
    map?.getView().animate({
      zoom: currentZoom - 1,
      duration: 250,
    });
  }
};

export const resetZoomAndCoordinate = (map: Map, center: Coordinate) => {
  map?.getView().animate({
    zoom: 15,
    duration: 250,
    center: fromLonLat([center.longitude, center.latitude]),
  });
};
