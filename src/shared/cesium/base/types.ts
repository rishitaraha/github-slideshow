import { CesiumViewerType } from '@aus-platform/cesium';

export interface ICesiumBase {
  /**
   * Getter to get cesium's viewer object
   * @returns Viewer
   */
  baseViewer: CesiumViewerType;
}
