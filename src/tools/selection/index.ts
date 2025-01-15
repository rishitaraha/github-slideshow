import { Viewer } from 'cesium';
import { CesiumViewerType } from '../../types';
import { SelectFeatureTool } from './select-feature-tool';

export * from './select-feature-tool';
export * from './select-feature';
export * from '../base/enums';
export * from './types';

export class SelectTools {
  selectFeatureTool: SelectFeatureTool;

  constructor(viewer: Viewer) {
    this.selectFeatureTool = new SelectFeatureTool({
      viewer: <CesiumViewerType>viewer,
    });
  }

  destroy() {
    if (this.selectFeatureTool) {
      this.selectFeatureTool.destroy();
    }
  }
}
