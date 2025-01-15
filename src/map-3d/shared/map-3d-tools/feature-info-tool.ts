import {
  FeatureInfoTool as CesiumFeatureInfoTool,
  CesiumViewer,
} from '@aus-platform/cesium';
import { BaseTool } from './base-tool/base-tool';
import { ToolEvent } from './enums';
import { FeatureInfoToolEventListener, IFeatureInfoTool } from './interfaces';

export class FeatureInfoTool extends BaseTool implements IFeatureInfoTool {
  private _featureInfoTool: CesiumFeatureInfoTool;

  constructor(viewer: CesiumViewer) {
    if (!viewer.viewer) {
      throw new Error('Viewer is not initialized');
    }

    super(viewer);
    this._featureInfoTool = viewer.viewer.infoTool;
  }

  activate() {
    this._featureInfoTool.activate();
  }

  deactivate() {
    this.viewer?.deactivateCurrentMapTool();
  }

  // Event listener.
  addEventListener(type: ToolEvent, listener: FeatureInfoToolEventListener) {
    switch (type) {
      case ToolEvent.Blur: {
        return this._featureInfoTool.featureInfoTool.eventOnFeatureBlur.addEventListener(
          listener,
        );
      }
      case ToolEvent.Focus: {
        return this._featureInfoTool.featureInfoTool.eventOnFeatureFocus.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Only "blur" and "focus" event types are allowed');
      }
    }
  }

  removeEventListener(type: ToolEvent, listener: FeatureInfoToolEventListener) {
    switch (type) {
      case ToolEvent.Blur: {
        return this._featureInfoTool.featureInfoTool.eventOnFeatureBlur.removeEventListener(
          listener,
        );
      }
      case ToolEvent.Focus: {
        return this._featureInfoTool.featureInfoTool.eventOnFeatureFocus.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Only "blur" and "focus" event types are allowed');
      }
    }
  }

  // Getters.
  get featureInfoTool(): CesiumFeatureInfoTool {
    return this._featureInfoTool;
  }
}
