import { Cartesian3, Cartographic, destroyObject, Event } from 'cesium';

import { StyleOptions } from '../tools';
import DrawingSettings from '../tools/drawing/drawing-tool-settings';
import { ExportedWKTType } from '../tools/drawing/types';
import { TextboxConstructorOptions } from '../types';
import { GEOMETRY_TYPE, getLabelSVG, LabelSVGType } from '../utils';
import { isIncludeProperty, radianToString } from '../utils/common';
import { BaseFeature } from './base/base-feature';

export class Textbox extends BaseFeature {
  private _position: Cartesian3;
  private _fontSize: number;
  private _fontFamily: string;
  // Textbox is placed on the terrain by elevator at the position in general.
  // But sometimes it needs not to placed on the terrain, but to place by its
  // own height, e.g, in Measurement tool, Textbox is placed on center of
  // vertical, horizontal, direct lines each.
  // If _height is 0, Textbox will not placed on the terrain, but placed
  // by it's own height.
  private _height = Number.NaN;

  private readonly _showChanged: Event;

  constructor(options: TextboxConstructorOptions) {
    super(options);
    this._selectedLocale = options.locale;
    this._position = options.position;

    this._labelCollection = options.labelCollection;
    const labelOptions = {
      position: new Cartesian3(),
      image: undefined,
      show: true,
      disableDepthTestDistance: Number.POSITIVE_INFINITY,
      sizeInMeters: true,
    };
    this._label = this._labelCollection.add(labelOptions);
    this._labelText = '';
    this._label.show = true;
    this._label.id = this._id;

    if (options.fontSize) {
      this._fontSize = options.fontSize;
    } else {
      this._fontSize = DrawingSettings.labelFontSize;
    }

    if (options.fontFamily) {
      this._fontFamily = options.fontFamily;
    } else {
      this._fontFamily = DrawingSettings.labelFontFamily;
    }

    this._showChanged = new Event();
    if (options.properties) {
      this._properties = options.properties;
    }

    this._properties = {
      ...this._properties,
      type: GEOMETRY_TYPE.TEXT,
    };

    this._scene.camera.moveEnd.addEventListener(this.cameraMoveEndEvent);
  }

  cameraMoveEndEvent = () => {
    this.updateTextPosition(this._position);
    this.fixLabelSizeInMeter();
  };

  setText(labelText: string, labelOptions?: LabelSVGType) {
    if (!this._label || labelText === '') {
      return;
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

    this._label.image = labelSVG;

    this.updateTextPosition(this.position);

    this._label.show = true;
  }

  hideTextbox() {
    if (this._label) {
      this._label.show = false;
    }
  }

  showTextbox() {
    if (this._label && this._labelText && this._labelText !== '') {
      this._label.show = true;
    }
  }

  hasProperty(property: Record<string, any>) {
    return isIncludeProperty(this._properties, property);
  }

  updateTextPosition(position: Cartesian3) {
    const scene = this._scene;
    const ellipsoid = scene.globe.ellipsoid;
    const scratchCartographic = new Cartographic();
    ellipsoid.cartesianToCartographic(position, scratchCartographic);

    scratchCartographic.height = 0;

    const height = !Number.isNaN(this._height)
      ? this._height
      : scene.globe.getHeight(scratchCartographic);

    Cartesian3.fromRadians(
      scratchCartographic.longitude,
      scratchCartographic.latitude,
      height,
      ellipsoid,
      this._position,
    );

    if (!this._label) {
      return;
    }

    this._label.position = this._position;
  }

  set position(position: Cartesian3) {
    this._position = position;
    this.updateTextPosition(position);
  }

  get position() {
    return this._position;
  }

  get id() {
    return this._id;
  }

  set id(id) {
    this._id = id;
    if (this._label) {
      this._label.id = this._id;
    }
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
    this._showChanged.raiseEvent([show]);
    this._scene.requestRender();
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

  get fontSize() {
    return this._fontSize;
  }

  set fontSize(size: number) {
    this._fontSize = size;
  }

  get fontFamily() {
    return this._fontFamily;
  }

  set fontFamily(font: string) {
    this._fontFamily = font;
  }

  get height() {
    return this._height;
  }

  set height(height: number) {
    this._height = height;
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  exportWKT(): ExportedWKTType {
    if (!this._label) {
      return {
        id: this.id,
        wkt: '',
        text: this._labelText,
      };
    }
    let wktString = GEOMETRY_TYPE.POINT.toUpperCase() + ' ';
    const tmpCartographic = Cartographic.fromCartesian(this._label.position);
    wktString += `(${radianToString(
      tmpCartographic.longitude,
    )} ${radianToString(tmpCartographic.latitude)})`;

    return {
      id: this.id,
      wkt: wktString,
      text: this._labelText,
    };
  }

  changeStyle(styleOptions: StyleOptions) {
    if (!this._label) {
      return;
    }

    const { textboxStyleOptions: options } = styleOptions;

    if (!options) {
      return;
    }

    const textBoxStyle: LabelSVGType = {};

    if (options.backgroundColor) {
      textBoxStyle.backgroundColor = options.backgroundColor;
    }

    if (options.fontColor) {
      textBoxStyle.textColor = options.fontColor;
    }

    if (options.fontSize) {
      this._fontSize = options.fontSize;
      textBoxStyle.fontSize = options.fontSize;
    }

    if (options.opacity) {
      textBoxStyle.opacity = options.opacity;
    }

    textBoxStyle.text = this._labelText;

    this._labelOptions = { ...this._labelOptions, ...textBoxStyle };
    const labelSVG = getLabelSVG(this._labelOptions);
    this._label.image = labelSVG;
  }

  featureFocused() {}

  featureBlur() {}

  resetStyle() {
    if (!this._label) {
      return;
    }
    const resetStyle = {
      backgroundColor: DrawingSettings.labelBackgroundColor.toCssColorString(),
      textColor: DrawingSettings.labelTextColor.toCssColorString(),
      fontSize: 16,
      opacity: 1,
    };

    this._labelOptions = { ...this._labelOptions, ...resetStyle };

    const labelSVG = getLabelSVG(this._labelOptions);
    this._label.image = labelSVG;
  }

  toggleVisibility() {
    this.show = !this.show;
  }

  toggleVisibilityMainVertex() {}

  destroy() {
    super.destroy();
    this.show = false;
    this._scene.camera.moveEnd.removeEventListener(this.cameraMoveEndEvent);
    if (this._labelCollection && this._label) {
      this._labelCollection.remove(this._label);
    }
    return destroyObject(this);
  }
}
