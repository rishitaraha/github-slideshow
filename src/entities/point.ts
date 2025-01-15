// q@ts-nocheck
/* qeslint-disable */
import {
  Billboard,
  BillboardCollection,
  Cartesian2,
  Cartesian3,
  Cartographic,
  Color,
  defaultValue,
  destroyObject,
  Event,
  HorizontalOrigin,
  PointPrimitive,
  VerticalOrigin,
} from 'cesium';

import { POINT_LABEL_OFFSET } from '../shared/constants';
import { StyleOptions } from '../tools';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { ExportedWKTType } from '../tools/drawing/types';
import { PointConstructorOptions, PointOptions } from '../types';
import {
  GEOMETRY_TYPE,
  getLabelSVG,
  getPointMarkerSVG,
  LabelSVGType,
} from '../utils';
import { isIncludeProperty, radianToString } from '../utils/common';
import { BaseFeature } from './base/base-feature';

export class Point extends BaseFeature {
  private _position: Cartesian3;
  private readonly _primitive: PointPrimitive;
  private readonly _pointOptions: PointOptions;
  private _markerCollection?: BillboardCollection;
  private _markerBillboard?: Billboard;
  private readonly _showChanged: Event;
  // Show point as primitive or shape.
  private _isShowShape = true;

  constructor(options: PointConstructorOptions) {
    super(options);
    const primitives = options.primitives;
    const pointOptions = options.pointOptions;

    this._pointOptions = pointOptions;
    this._selectedLocale = options.locale;
    this._primitive = options.primitive;
    this._primitives = primitives;
    this._position = defaultValue(this._primitive.position, Cartesian3.ZERO);
    this._isShowShape = options.isShowShape;

    if (this._primitive) {
      this.primitive.id = this._id;
    }

    this._showChanged = new Event();
    if (options.properties) {
      this._properties = options.properties;
    }
    this._properties = {
      ...this._properties,
      type: GEOMETRY_TYPE.POINT,
      isEditable: false,
    };
    this._styleOptions = DrawingSettings.getPointDefaultStyle();
    this._focusedStyle = DrawingSettings.getPointFocusedStyle();

    this.createMarker();

    if (!this._isShowShape) {
      this._primitive.show = true;
    }

    this._scene.camera.moveEnd.addEventListener(this._eventLabelSizeFix);
  }

  setLabel(labelText: string, labelOptions?: LabelSVGType) {
    if (labelText === '') {
      this.destroyLabel();
      return;
    }

    if (!this._labelCollection && !this._label) {
      this.createLabel();
    }

    this._labelText = labelText;
    let labelSVG: string;
    if (labelOptions) {
      this._labelOptions = labelOptions;
      this._labelOptions.text = this._labelText;
      labelSVG = getLabelSVG(this._labelOptions);
    } else {
      labelSVG = getLabelSVG({ text: this._labelText });
    }

    if (this._label) {
      this._label.image = labelSVG;

      this.updateLabelPosition();
      this._label.show = true;
    }
  }

  setLabelStyle(styleOptions: LabelSVGType) {
    if (!this._labelText) {
      return;
    }
    this._labelOptions = { ...this._labelOptions, ...styleOptions };
    this._labelOptions.text = this._labelText;
    const labelSVG = getLabelSVG(this._labelOptions);

    if (this._label) {
      this._label.image = labelSVG;
    }
  }

  hideLabel() {
    if (this._label) {
      this._label.show = false;
    }
  }

  showLabel() {
    if (this._labelText && this._labelText !== '' && this._label) {
      this._label.show = true;
    }
  }

  destroyLabel() {
    this._labelText = '';
    if (this._labelCollection && this._label) {
      this._label.show = false;
      this._primitives.remove(this._labelCollection);
      destroyObject(this._labelCollection);
      destroyObject(this._label);
      this._labelCollection = undefined;
      this._label = undefined;
    }
  }

  createLabel() {
    const labelOptions = {
      position: new Cartesian3(),
      image: undefined,
      show: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      pixelOffset: POINT_LABEL_OFFSET,
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
    };

    this._labelCollection = this._primitives.add(new BillboardCollection());
    if (this._labelCollection) {
      this._label = this._labelCollection.add(labelOptions);
      this._labelText = '';
      this._label.show = false;
      this._label.id = `${this._id}|${GEOMETRY_TYPE.TEXT}`;
    }
  }

  createMarker() {
    const markerOption = {
      position: this._position,
      image: getPointMarkerSVG(),
      show: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      pixelOffset: new Cartesian2(0, 0),
      horizontalOrigin: HorizontalOrigin.CENTER,
      verticalOrigin: VerticalOrigin.BOTTOM,
    };

    this._markerCollection = this._primitives.add(new BillboardCollection());
    if (this._markerCollection) {
      this._markerBillboard = this._markerCollection.add(markerOption);
      this._markerBillboard.id = `${this._id}|${GEOMETRY_TYPE.TEXT}|marker`;
    }

    if (!this._isShowShape && this._markerBillboard) {
      this._markerBillboard.show = false;
    }
  }

  hasProperty(property: Record<string, any>) {
    return isIncludeProperty(this._properties, property);
  }

  updateLabelPosition() {
    if (this._label) {
      this._label.position = this._primitive.position;
    }
  }

  set position(position: Cartesian3) {
    const scene = this._scene;
    const ellipsoid = scene.globe.ellipsoid;
    const scratchCarto = new Cartographic();

    ellipsoid.cartesianToCartographic(position, scratchCarto);

    scratchCarto.height = 0;

    const height = scene.globe.getHeight(scratchCarto);

    Cartesian3.fromRadians(
      scratchCarto.longitude,
      scratchCarto.latitude,
      height,
      ellipsoid,
      this._primitive.position,
    );

    this._position = this._primitive.position;
    if (this._markerBillboard) {
      this._markerBillboard.position = this._position;
      this._markerBillboard.show = true;
    }

    if (this._label) {
      this._label.position = this._position;
    }
  }

  get position() {
    return this._position;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
    this._primitive.id = this._id;
  }

  get name() {
    return this._name;
  }

  set name(name) {
    this._name = name;
  }

  get show() {
    return this._show;
  }

  set show(show) {
    if (this._show === show) {
      return;
    }

    this._show = show;
    if (this._label) {
      this._label.show = show;
    }

    if (show) {
      if (this._isShowShape && this._markerBillboard) {
        this._primitive.show = false;
        this._markerBillboard.show = true;
      } else {
        this._primitive.show = true;
        if (this._markerBillboard) {
          this._markerBillboard.show = false;
        }
      }
    } else {
      this._primitive.show = false;
      if (this._markerBillboard) {
        this._markerBillboard.show = false;
      }
    }

    this._showChanged.raiseEvent([show]);
    this._scene.requestRender();
  }

  get primitive() {
    return this._primitive;
  }

  get showChanged() {
    return this._showChanged;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any>) {
    this._properties = properties;
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  exportWKT(): ExportedWKTType {
    let wktString = GEOMETRY_TYPE.POINT.toUpperCase() + ' ';
    const tmpCartographic = Cartographic.fromCartesian(this.position);
    wktString += `(${radianToString(
      tmpCartographic.longitude,
    )} ${radianToString(tmpCartographic.latitude)})`;

    return {
      id: this.id,
      wkt: wktString,
    };
  }

  toggleVisibilityMainVertex(show: boolean) {
    const color = show ? DrawingSettings.activeColor : DrawingSettings.color;
    this._primitive.color = color;
    // When point showed as shape.
    if (this._markerBillboard) {
      this._markerBillboard.image = show
        ? getPointMarkerSVG(
            DrawingSettings.defaultPointColor.toCssHexString(),
            DrawingSettings.activePointStrokeColor,
            DrawingSettings.activePointStrokeWidth,
          )
        : getPointMarkerSVG();
    }
  }

  toggleVisibility() {
    this.show = !this._show;
  }

  toggleMarkerAndShape() {
    if (this._isShowShape) {
      this.showMarker();
    } else {
      this.showShape();
    }
  }

  showShape() {
    if (this._show && this._markerBillboard) {
      this._isShowShape = true;
      this._primitive.show = false;
      this._markerBillboard.show = true;
    }
  }

  showMarker() {
    if (this._show && this._markerBillboard) {
      this._isShowShape = false;
      this._primitive.show = true;
      this._markerBillboard.show = false;
    }
  }

  // Update feature style such as focused style, blur style, style changes from frontend.
  updateStyle(styleOptions: StyleOptions) {
    const { pointStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }

    const { label, labelColor, opacity, color, strokeColor, strokeWidth } =
      options;

    if (label !== undefined) {
      this.setLabel(label);
      if (labelColor) {
        this.setLabelStyle({ backgroundColor: labelColor });
      }
    }

    if (opacity) {
      const color = this._primitive.color;
      this._primitive.color = color.withAlpha(opacity);
    }

    if (!this._markerBillboard) {
      return;
    }

    if (color) {
      this._primitive.color = Color.fromCssColorString(color);
    }

    this._markerBillboard.image = getPointMarkerSVG(
      color,
      strokeColor,
      strokeWidth,
    );
  }

  changeStyle(styleOptions: StyleOptions) {
    const { pointStyleOptions: options } = styleOptions;
    if (!options) {
      return;
    }

    this._styleOptions = styleOptions;
    this.updateStyle(this._styleOptions);
  }

  featureFocused(focusedStyle?: StyleOptions) {
    if (focusedStyle) {
      this._focusedStyle = focusedStyle;
    }

    this.updateStyle(this._focusedStyle);
    this._isFocused = true;
  }

  featureBlur() {
    this.updateStyle(this._styleOptions);
    this._isFocused = false;
  }

  resetStyle() {
    this._primitive.color = DrawingSettings.color;
  }

  destroy() {
    super.destroy();
    this.show = false;
    this._scene.camera.moveEnd.removeEventListener(this._eventLabelSizeFix);
    this._primitives.remove(this._primitive);
    return destroyObject(this);
  }
}
