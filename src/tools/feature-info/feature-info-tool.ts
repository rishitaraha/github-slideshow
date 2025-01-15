import { Ellipsoid, destroyObject, Viewer } from 'cesium';
import { MapTools } from '../base';
import { CesiumViewerType } from '../../types';
import { FeatureInfo } from './feature-info';

class FeatureInfoTool extends MapTools {
  private _featureInfoTool: FeatureInfo;
  constructor(options: { viewer: Viewer; ellipsoid?: Ellipsoid }) {
    super(options);
    this._viewer = <CesiumViewerType>options.viewer;
    this._featureInfoTool = new FeatureInfo({
      viewer: options.viewer,
      name: 'cesium-info-tool',
      // TODO: add cursor style.
      cursorStyle: undefined,
    });
  }

  get featureInfoTool() {
    return this._featureInfoTool;
  }

  activate() {
    this._viewer.setMapTool?.(this._featureInfoTool);
    this._featureInfoTool.activateInfoTool();
  }

  destroy() {
    destroyObject(this);
  }
}

export { FeatureInfoTool };
