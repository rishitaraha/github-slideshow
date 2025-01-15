import { destroyObject, Scene } from 'cesium';
import { CesiumViewerType } from '../../types';
import { getFeatureFromIdWithType } from '../../utils/get-feature';
import { MapTool } from '../base';
import { StyleFeatureConstructorOptions, StyleOptions } from './types';

export class StyleFeature extends MapTool {
  private readonly _scene: Scene;
  private readonly _options: StyleFeatureConstructorOptions;

  constructor(options: StyleFeatureConstructorOptions) {
    super(options);

    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this._options = options;
  }

  get options() {
    return this._options;
  }

  activate() {
    super.activate();

    return true;
  }

  deactivate() {
    super.deactivate();
  }

  changeFeatureStyle(id: string, styleOptions: StyleOptions) {
    const featureInfo = getFeatureFromIdWithType(
      id,
      this._viewer as CesiumViewerType,
    );
    if (!featureInfo) {
      return;
    }

    const { feature } = featureInfo;

    if (!feature) {
      return;
    }

    feature.changeStyle(styleOptions);
  }

  resetFeatureStyle(id: string) {
    const featureInfo = getFeatureFromIdWithType(
      id,
      this._viewer as CesiumViewerType,
    );
    if (!featureInfo) {
      return;
    }

    const { feature } = featureInfo;

    if (!feature) {
      return;
    }

    feature.resetStyle();
  }

  destroy() {
    return destroyObject(this);
  }
}
