import { destroyObject, Ellipsoid } from 'cesium';
import { CesiumViewerType } from '../../types';
import { clearArray } from '../../utils';
import { MapTools } from '../base';
import { SelectFeature } from './select-feature';

export class SelectFeatureTool extends MapTools {
  private readonly _selectFeature: SelectFeature;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    this._selectFeature = new SelectFeature({
      viewer: options.viewer,
      name: 'SelectFeature',
      cursorStyle: undefined,
      selectedFeatures: [],
    });
  }

  get selectFeature() {
    return this._selectFeature;
  }

  activateSelectFeature(selectOption?: Record<string, any>) {
    if (selectOption) {
      this.selectFeature.selectOption = selectOption;
    }
    this._viewer.setMapTool?.(this._selectFeature);
  }

  getCount() {
    return this.selectFeature.selectedFeatures.length;
  }

  destroy() {
    this._selectFeature.destroy();
    clearArray(this.selectFeature.selectedFeatures);
    destroyObject(this);
  }
}
