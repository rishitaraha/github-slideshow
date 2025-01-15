import { CesiumViewer, CesiumViewerType } from '@aus-platform/cesium';
import { ICesiumBase } from './types';

export class CesiumBase implements ICesiumBase {
  #baseViewer: CesiumViewerType;

  constructor(viewer: CesiumViewer) {
    if (!viewer.viewer) {
      throw new Error('Viewer is not initialized');
    }
    this.#baseViewer = viewer.viewer;
  }

  get baseViewer() {
    return this.#baseViewer;
  }
}
