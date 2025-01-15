/* eslint-disable @typescript-eslint/ban-ts-comment */
// q@ts-nocheck
/* qeslint-disable */
/* eslint-disable no-param-reassign */
import {
  Cartesian2,
  Cartesian3,
  ClassificationType,
  Color,
  defaultValue,
  defined,
  Ellipsoid,
  HorizontalOrigin,
  VerticalOrigin,
} from 'cesium';
import {
  DEFAULT_LABEL_PIXEL_OFFSET,
  DEFAULT_POLYGON_COLOR,
  DEFAULT_POLYGON_OPACITY,
} from '../../shared';
import { LabelOptions, PolylineOptions } from '../../types';
import { PointState } from './types';

class DrawingSettings {
  public static color = Color.fromCssColorString('#ffcc33', new Color());
  public static activeColor = Color.fromCssColorString('#3f95fd');
  public static defaultPointColor = Color.fromCssColorString('#F9CC34');
  public static activePointColor = Color.fromCssColorString('#5E1AE5');
  public static activePointStrokeColor = '#FFFFFF';
  public static activePointStrokeWidth = 1.6;
  public static labelFont = '16px Lucida Console';
  public static labelFontFamily = 'Lucida Console';
  public static defaultFontFamily = 'Lucida Console';
  public static labelFontSize = 16;
  public static markerPointId = 'marker_point_primitive';
  public static textColor = Color.WHITE;
  public static dashLength = 16;
  public static lineWidth = 3;
  public static backgroundColor = new Color(0.165, 0.165, 0.165, 0.8);
  public static labelBackgroundColor = Color.fromCssColorString(
    '#ffcc33',
    new Color(),
  );
  public static labelTextColor = Color.fromCssColorString(
    '#000000',
    new Color(),
  );
  public static backgroundPadding = new Cartesian2(7, 5);

  // Return line options, almost are style.
  public static getPolylineOptions = function (options: PolylineOptions) {
    options = defaultValue(options, {});

    return {
      show: options.show,
      ellipsoid: options.ellipsoid,
      width: defaultValue(options.width, DrawingSettings.lineWidth),
      color: defaultValue(options.color, DrawingSettings.color),
      depthFailColor: defaultValue(
        defaultValue(options.depthFailColor, options.color),
        DrawingSettings.color,
      ),
      id: options.id,
      positions: options.positions,
      loop: options.loop,
      clampToGround: options.clampToGround,
      classificationType: options.classificationType,
      allowPicking: defaultValue(options.allowPicking, true),
      dashed: defaultValue(options.dashed, false),
      dashLength: defaultValue(options.dashLength, DrawingSettings.dashLength),
    };
  };

  public static getPolylineDefaultStyle = function (label?: string) {
    return {
      lineStyleOptions: {
        strokeColor: DrawingSettings.color.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth,
        label: label,
        labelColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1.0,
      },
    };
  };

  public static getPolylineFocusStyle = function (label?: string) {
    return {
      lineStyleOptions: {
        strokeColor: DrawingSettings.activeColor.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth + 1,
        label: label,
        labelColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1.0,
      },
    };
  };
  // Return polygon options.
  public static getPolygonOptions = function (options: {
    show: boolean;
    ellipsoid: Ellipsoid;
    color: Color;
    depthFailColor: Color;
    id: string;
    positions: Cartesian3[];
    clampToGround: boolean;
    classificationType: ClassificationType;
    allowPicking: boolean;
  }) {
    options = defaultValue(options, {});

    return {
      show: options.show,
      ellipsoid: options.ellipsoid,
      color: defaultValue(options.color, DrawingSettings.color),
      depthFailColor: defaultValue(
        defaultValue(options.depthFailColor, options.color),
        DrawingSettings.color,
      ),
      id: options.id,
      positions: options.positions,
      clampToGround: options.clampToGround,
      classificationType: options.classificationType,
      allowPicking: defaultValue(options.allowPicking, true),
    };
  };

  public static getPolygonDefaultStyle = function (label?: string) {
    return {
      polygonStyleOptions: {
        fillColor: DEFAULT_POLYGON_COLOR.toCssColorString(),
        fillOpacity: DEFAULT_POLYGON_OPACITY,
        label: label,
        labelColor: DrawingSettings.color.toCssColorString(),
        strokeColor: DrawingSettings.color.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth,
        opacity: DEFAULT_POLYGON_OPACITY,
      },
    };
  };

  public static getPolygonFocusedStyle = function (label?: string) {
    return {
      polygonStyleOptions: {
        fillColor: DEFAULT_POLYGON_COLOR.toCssColorString(),
        strokeColor: DrawingSettings.activeColor.toCssColorString(),
        strokeThickness: DrawingSettings.lineWidth + 1,
        label: label,
        labelColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1,
      },
    };
  };

  // Return point options.
  public static getPointOptions = function (pointState?: PointState) {
    if (pointState && pointState === PointState.HOVER) {
      return {
        pixelSize: 8,
        color: DrawingSettings.color,
        position: new Cartesian3(),
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
        show: false,
        outlineColor: Color.WHITE,
        outlineWidth: 2,
      };
    }

    if (pointState && pointState === PointState.ACTIVE) {
      return {
        pixelSize: 6,
        color: DrawingSettings.activePointColor,
        position: new Cartesian3(),
        disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
        show: false,
        outlineColor: Color.WHITE,
        outlineWidth: 3,
      };
    }

    return {
      pixelSize: 10,
      color: DrawingSettings.color,
      position: new Cartesian3(),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      show: false,
      outlineColor: Color.WHITE,
      outlineWidth: 1,
    };
  };

  public static getPointDefaultStyle = function (label?: string) {
    return {
      pointStyleOptions: {
        color: DrawingSettings.color.toCssColorString(),
        label: label,
        labelColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1,
      },
    };
  };

  public static getPointFocusedStyle = function (label?: string) {
    return {
      pointStyleOptions: {
        color: DrawingSettings.activeColor.toCssColorString(),
        label: label,
        labelColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1,
      },
    };
  };

  // Return marker options.
  public static getMarkerPointOptions = function () {
    return {
      pixelSize: 9,
      color: DrawingSettings.activeColor,
      position: new Cartesian3(),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      show: false,
      outlineColor: Color.WHITE,
      outlineWidth: 1,
      id: DrawingSettings.markerPointId,
    };
  };

  // Return label options.
  public static getLabelOptions = function (
    options:
      | {
          scale: number;
          horizontalOrigin: HorizontalOrigin;
          verticalOrigin: VerticalOrigin;
          pixelOffset: Cartesian2;
          fillColor?: Color;
          backgroundColor?: Color;
          backgroundPadding?: Cartesian2;
        }
      | undefined,
  ): LabelOptions {
    options = defaultValue(options, {});

    return {
      show: false,
      font: DrawingSettings.labelFont,
      // @ts-ignore
      scale: defaultValue(options.scale, 1.0),
      // @ts-ignore
      fillColor: defaultValue(
        options?.fillColor,
        DrawingSettings.labelTextColor,
      ),
      showBackground: true,
      // @ts-ignore
      backgroundColor: defaultValue(
        options?.backgroundColor,
        DrawingSettings.labelBackgroundColor,
      ),
      // @ts-ignore
      backgroundPadding: defaultValue(
        options?.backgroundPadding,
        DrawingSettings.backgroundPadding,
      ),

      // @ts-ignore
      horizontalOrigin: defaultValue(
        options?.horizontalOrigin,
        HorizontalOrigin.CENTER,
      ),
      // @ts-ignore
      verticalOrigin: defaultValue(
        options?.verticalOrigin,
        VerticalOrigin.CENTER,
      ),
      // @ts-ignore
      pixelOffset: defined(options.pixelOffset)
        ? options?.pixelOffset
        : Cartesian2.clone(DEFAULT_LABEL_PIXEL_OFFSET),
      disableDepthTestDistance: Number.POSITIVE_INFINITY, // for draw-over
      position: new Cartesian3(),
    };
  };
}

export default DrawingSettings;
