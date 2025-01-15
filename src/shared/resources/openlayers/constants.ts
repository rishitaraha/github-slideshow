import { ColorCodes } from '@aus-platform/design-system';
import { isUndefined } from 'lodash';
import { Circle, Fill, Icon, Stroke, Style, Text } from 'ol/style';
import { IconImage } from '../../../assets';
import { FeaturesStyles } from '../../api';
import { hexToRGB } from '../../utils';

export const styles = (featureStyles?: FeaturesStyles) => {
  const stylesObject = {
    Point: new Style({
      image: new Icon({
        src: IconImage.MapPoint,
        color: ColorCodes.White,
        displacement: [0, 10],
      }),
    }),

    LineString: new Style({
      stroke: new Stroke({
        color: ColorCodes.OrangeLine,
        width: 2,
      }),
    }),

    Polygon: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: ColorCodes.GreenPolygon,
        width: 2,
      }),
    }),

    Measure: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: 'rgba(255, 255, 255, 1)',
        lineDash: [10, 10],
        width: 2,
      }),
    }),

    ToolsVectorLayer: new Style({
      fill: new Fill({
        color: 'rgba(255, 255, 255, 0.2)',
      }),
      stroke: new Stroke({
        color: '#ffcc33',
        width: 2,
      }),
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: '#ffcc33',
        }),
      }),
    }),
  };

  if (featureStyles) {
    const { point, line, polygon } = featureStyles;

    if (!isUndefined(point)) {
      stylesObject.Point.setFill(new Fill({ color: point.color }));
    }
    if (!isUndefined(line)) {
      stylesObject.LineString.setStroke(
        new Stroke({ color: line.strokeColor, width: line.strokeThickness }),
      );
    }
    if (!isUndefined(polygon)) {
      stylesObject.Polygon.setFill(
        new Fill({ color: hexToRGB(polygon.fillColor ?? '', 0.2) }),
      );
      stylesObject.Polygon.setStroke(
        new Stroke({
          color: polygon.strokeColor,
          width: polygon.strokeThickness,
        }),
      );
    }
  }
  return stylesObject;
};

export const layerLabel = {
  Point: new Text({
    textAlign: 'center',
    textBaseline: 'middle',
    font: '400 10px/1 Nunito',
    fill: new Fill({ color: ColorCodes.Black }),
    stroke: new Stroke({ color: ColorCodes.White, width: 3 }),
    offsetX: 0,
    offsetY: -20,
  }),

  LineString: new Text({
    textAlign: 'center',
    textBaseline: 'middle',
    font: '700 10px/1 Nunito',
    fill: new Fill({ color: ColorCodes.OrangeLine }),
    stroke: new Stroke({ color: ColorCodes.White, width: 3 }),
    offsetX: 0,
    offsetY: 0,
    placement: 'line',
    maxAngle: 45,
    overflow: false,
  }),

  Polygon: new Text({
    textAlign: 'center',
    textBaseline: 'middle',
    font: '700 10px/1 Nunito',
    fill: new Fill({ color: ColorCodes.GreenPolygon }),
    stroke: new Stroke({ color: ColorCodes.White, width: 3 }),
    offsetX: 0,
    offsetY: 0,
    placement: 'point',
    maxAngle: 45,
    overflow: false,
  }),
};
