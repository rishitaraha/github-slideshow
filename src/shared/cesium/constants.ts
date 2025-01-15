import { ColorCodes } from '@aus-platform/design-system';
import {
  Color,
  ImageryProvider,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';

export const baseMapImageryProvider = new UrlTemplateImageryProvider({
  url: 'https://mt0.google.com/vt/lyrs=y&hl=en&x={x}&y={y}&z={z}&s=Ga',
  maximumLevel: 22,
  minimumLevel: 0,
});

export const defaultCesiumViewerOptions: Viewer.ConstructorOptions & {
  imageryProvider?: ImageryProvider | boolean;
} = {
  infoBox: false,
  timeline: false,
  fullscreenButton: false,
  selectionIndicator: false,
  animation: false,
  baseLayerPicker: false,
  navigationHelpButton: false,
  homeButton: false,
  sceneModePicker: false,
  geocoder: false,
  imageryProvider: false,
};

export const styles = {
  Point: {
    markerColor: Color.RED,
    markerSymbol: '?',
    markerSize: 30,
  },
  Polygon: {
    fill: Color.fromCssColorString('rgba(255, 255, 255, 0.4)'),
    stroke: Color.fromCssColorString(ColorCodes.GreenPolygon),
    strokeWidth: 2,
  },
  LineString: {
    stroke: Color.fromCssColorString(ColorCodes.OrangeLine),
    strokeWidth: 2,
  },
};
