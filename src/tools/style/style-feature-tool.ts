import { destroyObject, Ellipsoid } from 'cesium';
import { CesiumViewerType } from '../../types';
import { MapTools } from '../base';
import { StyleFeature } from './style-feature';

export class StyleFeatureTool extends MapTools {
  private readonly _styleFeature: StyleFeature;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    this._styleFeature = new StyleFeature({
      viewer: options.viewer,
      name: 'StyleFeature',
      cursorStyle: undefined,
    });
  }

  get styleFeature() {
    return this._styleFeature;
  }

  activateSelectFeature() {
    this._viewer.setMapTool?.(this._styleFeature);
  }

  destroy() {
    this._styleFeature.destroy();
    destroyObject(this);
  }
}
