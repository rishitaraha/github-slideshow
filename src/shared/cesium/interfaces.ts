import { ImageryLayer } from 'cesium';
import { AddMapLayerParams, CesiumLayerManager } from './managers';
import { BoundingBox } from './types';
import { SwipeMapLayer } from 'src/swipe-map-3d';

export type SplitViewerAddMapLayerParams = {
  isLeftViewer: boolean;
} & AddMapLayerParams;

export interface ICesiumSplitViewer {
  /**
   * Function to add satellite imagery layer.
   */
  addBaseImageryLayers: VoidFunction;

  /**
   * Zooms to the bounds of a layer.
   *
   * @param layer Layer whose bounds we want to zoom to.
   * @param isLeftViewer Whether we're zooming to left viewer's layer.
   * @returns
   */
  zoomToLayer: (layer: SwipeMapLayer, isLeftViewer: boolean) => void;

  /**
   * Zooms out in the map view.
   *
   * @returns {void}
   */
  zoomOut: VoidFunction;

  /**
   * Zooms in the map view.
   *
   * @returns {void}
   */
  zoomIn: VoidFunction;

  /**
   * Resets the map view to the specified bounds or home position.
   *
   * @param {BoundingBox} [bounds] - The bounding box to fly to. If not provided, the map view resets to the home position.
   * @returns {void}
   */
  reset: (bounds?: BoundingBox) => void;

  /**
   * Generalised wrapper function to add map layers.
   * @param layer The layer object whose map layer has to be added.
   * @param show Flag to control if the map layer has to be displayed.
   * @param addTerrainLayerCallback Callback which exposes the terrain provider.
   *        Usage: This callback can be used to add the terrain provider to redux.
   * @param terrainProvider Terrain provider to add terrain
   * @param isLeftViewer flag to indicate which viewer area we're in.
   *
   * @returns The imagery layer wrapped in a promise.
   */
  addMapLayer: (
    mapLayerArgs: SplitViewerAddMapLayerParams,
  ) => Promise<ImageryLayer | undefined>;

  /**
   * Adds a terrain layer to either the left or right viewer.
   *
   * @param iterationId - The iteration ID associated with this terrain.
   * @param terrainPath - The S3 path (URI) of the terrain data.
   * @param isLeftViewer - Whether to add the terrain to the left viewer (true) or the right viewer (false).
   */
  addTerrain: (
    iterationId: string,
    terrainPath: string,
    isLeftViewer?: boolean,
  ) => void;

  /**
   * Resets the terrain provider for either the left or right viewer.
   *
   * @param isLeftViewer - Whether to reset the terrain provider on the left viewer (true) or the right viewer (false).
   */
  resetTerrain: (isLeftViewer?: boolean) => void;

  /**
   * Remove all imagery layers of left/right viewer except Satellite layer.
   *
   * @param isLeftViewer Flag to indicate which viewer to remove layers from.
   */
  removeAllImageryLayersExceptBase: (isLeftViewer: boolean) => void;

  /**
   * Removes one or more imagery layers from either the left or right viewer.
   *
   * @param isLeftViewer- Indicates whether to remove layers from the left viewer (true) or the right viewer (false).
   * @param mapLayers - An array of imagery layers to be removed.
   *
   */
  removeMapLayer: (isLeftViewer, mapLayers: ImageryLayer[]) => void;

  // Getters.
  leftLayerManager: CesiumLayerManager;
  rightLayerManager: CesiumLayerManager;
}
