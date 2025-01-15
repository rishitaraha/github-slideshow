import { CesiumViewer } from '@aus-platform/cesium';
import { ISelectFeatureTool, SelectFeatureTool } from './select-feature-tool';

export interface IActionTools {
  selectFeatureTool: ISelectFeatureTool;
  deactivateAllTools: VoidFunction;
  deleteAllCurrentFeatures: VoidFunction;
}

export class ActionTools implements IActionTools {
  private readonly _selectFeatureTool: ISelectFeatureTool;

  constructor(viewer: CesiumViewer) {
    this._selectFeatureTool = new SelectFeatureTool(viewer);
  }

  deleteAllCurrentFeatures() {
    this._selectFeatureTool.deselectSelectedFeatures();
  }

  deactivateAllTools() {
    this._selectFeatureTool.deactivate();
  }

  destroy() {
    this._selectFeatureTool.destroy();
  }

  get selectFeatureTool() {
    return this._selectFeatureTool;
  }
}
