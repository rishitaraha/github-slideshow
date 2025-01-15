import { MapToolConstructorOptions } from '../base';

export interface StyleFeatureConstructorOptions
  extends MapToolConstructorOptions {
  local?: string | string[];
  properties?: Record<string, any>;
}

export type PointStyleOptions = {
  color?: string;
  strokeColor?: string;
  strokeWidth?: number;
  label?: string;
  labelColor?: string;
  opacity?: number;
};

export type LineStyleOptions = {
  strokeColor?: string;
  strokeThickness?: number;
  label?: string;
  labelColor?: string;
  opacity?: number;
};

export type PolygonStyleOptions = {
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeThickness?: number;
  label?: string;
  labelColor?: string;
  opacity?: number;
};

export type TextboxStyleOptions = {
  fontColor?: string;
  fontSize?: number;
  backgroundColor?: string;
  opacity?: number;
};

export type StyleOptions = {
  pointStyleOptions?: PointStyleOptions;
  lineStyleOptions?: LineStyleOptions;
  polygonStyleOptions?: PolygonStyleOptions;
  textboxStyleOptions?: TextboxStyleOptions;
};
