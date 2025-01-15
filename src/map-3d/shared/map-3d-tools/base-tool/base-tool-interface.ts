import { CesiumViewer, CesiumViewerType } from '@aus-platform/cesium';

export interface IBaseTool {
  resetStyle: VoidFunction;
  resetCurrentDrawnArray: (saveFeatures?: boolean) => void;
  resetCurrentEditArray: (saveFeatures?: boolean) => void;
  resetCurrentDeletedArray: VoidFunction;

  // Getters.
  cesiumViewer: CesiumViewer;
  viewer: CesiumViewerType;
  loadedFeatureIds: string[];
}
