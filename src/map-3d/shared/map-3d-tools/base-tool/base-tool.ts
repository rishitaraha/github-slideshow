import { CesiumViewer, CesiumViewerType } from '@aus-platform/cesium';
import { ScreenSpaceEventHandler } from 'cesium';
import { isNil } from 'lodash';

export class BaseTool {
  private readonly _cesiumViewer: CesiumViewer;
  private readonly _screenSpaceEventHandler: ScreenSpaceEventHandler;

  constructor(viewer: CesiumViewer) {
    this._cesiumViewer = viewer;
    if (viewer.viewer) {
      this._screenSpaceEventHandler = viewer.viewer.screenSpaceEventHandler;
    } else {
      throw new Error('Viewer is not initialized');
    }
  }

  deactivate() {
    this.viewer.deactivateCurrentMapTool();
  }

  get cesiumViewer(): CesiumViewer {
    return this._cesiumViewer;
  }

  get viewer(): CesiumViewerType {
    if (isNil(this._cesiumViewer.viewer)) {
      throw new Error('Viewer is not initialized');
    }
    return this._cesiumViewer.viewer;
  }

  get screenSpaceEventHandler(): ScreenSpaceEventHandler {
    return this._screenSpaceEventHandler;
  }
}
