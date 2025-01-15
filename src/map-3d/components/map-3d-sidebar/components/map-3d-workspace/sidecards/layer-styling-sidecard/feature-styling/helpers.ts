import {
  LineStyleOptions,
  PointStyleOptions,
  PolygonStyleOptions,
  TextboxStyleOptions,
} from '@aus-platform/cesium';
import { FeaturesStyles } from '../../../../../../../../shared/api';
import { FeatureStyleInputType } from './types';

export const featureInputInitialState: FeatureStyleInputType = {
  pointLabel: '',
  pointColor: '#F9CC34',
  lineLabel: '',
  lineStrokeColor: '#F9CC34',
  lineStrokeThickness: 1,
  polygonLabel: '',
  polygonStrokeColor: '#F9CC34',
  polygonFillColor: '#F9CC34',
  polygonFillOpacity: 0.0,
  polygonStrokeThickness: 1,
  fontColor: '#000000',
  fontSize: 10,
};

export const featureStylingInputToFeatureStylesMapper = (
  values: FeatureStyleInputType,
): FeaturesStyles => {
  const {
    pointColor,
    pointLabel,
    polygonFillColor,
    polygonFillOpacity,
    polygonLabel,
    polygonStrokeColor,
    polygonStrokeThickness,

    lineLabel,
    lineStrokeColor,
    lineStrokeThickness,

    fontColor,
    fontSize,
  } = values;

  const pointStyleOptions: PointStyleOptions = {
    color: pointColor,
    label: pointLabel,
  };

  const polygonStyleOptions: PolygonStyleOptions = {
    fillColor: polygonFillColor,
    fillOpacity: polygonFillOpacity,
    strokeColor: polygonStrokeColor,
    strokeThickness: polygonStrokeThickness,
    label: polygonLabel,
  };

  const lineStyleOptions: LineStyleOptions = {
    label: lineLabel,
    strokeColor: lineStrokeColor,
    strokeThickness: lineStrokeThickness,
  };

  const textboxStyleOptions: TextboxStyleOptions = {
    fontColor,
    fontSize: +fontSize,
  };

  return {
    point: pointStyleOptions,
    line: lineStyleOptions,
    polygon: polygonStyleOptions,
    textbox: textboxStyleOptions,
  };
};

export const featuresStylesToFeatureStylingInputMapper = (
  featuresStyles: FeaturesStyles,
): FeatureStyleInputType => {
  return {
    pointColor:
      featuresStyles.point.color ?? featureInputInitialState.pointColor,
    pointLabel:
      featuresStyles.point.label ?? featureInputInitialState.pointLabel,

    lineLabel: featuresStyles.line.label ?? featureInputInitialState.lineLabel,
    lineStrokeColor:
      featuresStyles.line.strokeColor ??
      featureInputInitialState.lineStrokeColor,
    lineStrokeThickness:
      featuresStyles.line.strokeThickness ??
      featureInputInitialState.lineStrokeThickness,

    polygonFillColor:
      featuresStyles.polygon.fillColor ??
      featureInputInitialState.polygonFillColor,
    polygonFillOpacity:
      featuresStyles.polygon.fillOpacity ??
      featureInputInitialState.polygonFillOpacity,
    polygonLabel:
      featuresStyles.polygon.label ?? featureInputInitialState.polygonLabel,
    polygonStrokeColor:
      featuresStyles.polygon.strokeColor ??
      featureInputInitialState.polygonStrokeColor,
    polygonStrokeThickness:
      featuresStyles.polygon.strokeThickness ??
      featureInputInitialState.polygonStrokeThickness,

    fontColor:
      featuresStyles.textbox.fontColor ?? featureInputInitialState.fontColor,
    fontSize:
      featuresStyles.textbox.fontSize ?? featureInputInitialState.fontSize,
  };
};
