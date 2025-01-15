import {
  Billboard,
  BillboardCollection,
  BoundingSphere,
  Cartesian3,
  PrimitiveCollection,
  Scene,
  defaultValue,
} from 'cesium';
import { StyleOptions } from '../../tools';
import {
  BaseFeatureConstructorOptions,
  FeatureStatus,
  FeatureIdentity,
} from '../../types';
import { LabelSVGType } from '../../utils';
import { EPS } from '../../shared';
export interface IBaseFeature {
  toggleVisibilityMainVertex: (flag: boolean) => void;
  toggleVisibility: () => void;
  destroy: () => void;
  // Getters.
  featureType: FeatureIdentity;
  status: FeatureStatus;
}

export class BaseFeature implements IBaseFeature {
  protected readonly _scene: Scene;
  protected _positions: Cartesian3[];
  protected _primitives: PrimitiveCollection;
  protected _boundingSphere: BoundingSphere;

  protected _featureType: FeatureIdentity;
  protected _show: boolean;
  protected _id: string;
  protected _name: string;

  protected _showVertices: boolean;

  protected _labelOptions: LabelSVGType | undefined;
  protected _labelCollection?: BillboardCollection;
  protected _label?: Billboard;
  protected _labelText = '';

  // Focused feature options.
  protected _styleOptions: StyleOptions;
  protected _focusedStyle: StyleOptions;
  protected _isFocused = false;

  protected _properties: Record<string, any> = {};
  protected _selectedLocale: string | string[] | undefined;
  protected _status: FeatureStatus;

  // Label size fix event.
  protected _eventLabelSizeFix: () => void;

  // Flag to fix label size or not.
  private _isLabelSizeFixed = false;

  constructor(options: BaseFeatureConstructorOptions) {
    this._scene = options.scene;
    this._positions = [];
    this._primitives = this._scene.primitives;
    this._boundingSphere = new BoundingSphere();

    this._featureType = options.type;
    this._show = defaultValue(options.show, true);
    this._id = options.id;
    this._name = defaultValue(options.name, '');

    this._showVertices = false;

    this._styleOptions = {};
    this._focusedStyle = {};
    this._status = FeatureStatus.VIEW;

    this._eventLabelSizeFix = () => this.fixLabelSizeInMeter();
  }

  fixLabelSizeInMeter() {
    if (!this._label) {
      return;
    }

    if (this._isLabelSizeFixed) {
      this._label.sizeInMeters = false;
      return;
    }

    this.updateLabelPosition();
    const labelBoundingSphere = new BoundingSphere(
      this._label.position,
      this._label.width / 2,
    );

    const metersPerPixel = this._scene.camera.getPixelSize(
      labelBoundingSphere,
      this._scene.drawingBufferWidth,
      this._scene.drawingBufferHeight,
    );
    if (metersPerPixel < 1) {
      this._label.sizeInMeters = false;
    } else {
      this._label.sizeInMeters = true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  toggleVisibilityMainVertex(flag: boolean) {}

  toggleVisibility() {}

  toggleFixLabelSize() {
    this.isLabelSizeFixed = !this.isLabelSizeFixed;
  }

  updateLabelPosition() {}

  get featureType() {
    return this._featureType;
  }

  set featureType(typeString: FeatureIdentity) {
    this._featureType = typeString;
  }

  get status() {
    return this._status;
  }

  set status(value: FeatureStatus) {
    this._status = value;
    switch (value) {
      case FeatureStatus.VIEW:
        this.toggleVisibilityMainVertex(false);
        break;
      case FeatureStatus.ACTIVE:
        this.toggleVisibilityMainVertex(true);
        break;
      case FeatureStatus.EDIT:
        this.toggleVisibilityMainVertex(true);
        break;
      default:
        break;
    }
  }

  get primitives() {
    return this._primitives;
  }

  get isLabelSizeFixed() {
    return this._isLabelSizeFixed;
  }

  set isLabelSizeFixed(flag: boolean) {
    this._isLabelSizeFixed = flag;
    this._scene.camera.moveForward(EPS);
  }

  destroy() {}
}
