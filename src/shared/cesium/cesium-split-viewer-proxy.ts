import {
  SplitViewer,
  SplitViewerConstructorOptions,
  ZoomMode,
} from '@aus-platform/cesium';
import {
  Cartographic,
  ImageryLayer,
  Rectangle,
  BoundingSphere,
  Math as CesiumMath,
  HeadingPitchRange,
  Color,
} from 'cesium';
import CesiumNavigation, { NavigationOptions } from 'cesium-navigation-es6'; // eslint-disable-line import/default
import { ColorCodes } from '@aus-platform/design-system';
import { baseMapImageryProvider } from './constants';
import { ICesiumSplitViewer, SplitViewerAddMapLayerParams } from './interfaces';
import { CesiumLayerManager } from './managers';
import { BoundingBox } from './types';
import { SwipeMap3DBaseLayers, SwipeMapLayer } from 'src/swipe-map-3d';
import { getLayerMetadata } from 'map-3d/components';

export class CesiumSplitViewerProxy
  extends SplitViewer
  implements ICesiumSplitViewer
{
  private _leftViewerLayerManager: CesiumLayerManager;
  private _rightViewerLayerManager: CesiumLayerManager;

  constructor(options: SplitViewerConstructorOptions) {
    super(options);

    this._leftViewerLayerManager = new CesiumLayerManager(this.viewerLeft);
    this._rightViewerLayerManager = new CesiumLayerManager(this.viewerRight);

    if (this.viewerRight.viewer && this.viewerLeft.viewer) {
      const navigationOptions: NavigationOptions = {
        enableCompass: true,
        enableZoomControls: false,
        enableDistanceLegend: false,
        enableCompassOuterRing: true,
      };

      new CesiumNavigation(this.viewerRight.viewer, navigationOptions);
      new CesiumNavigation(this.viewerLeft.viewer, navigationOptions);
    }
  }

  addBaseImageryLayers(): SwipeMap3DBaseLayers | undefined {
    if (!this.viewerLeft.viewer || !this.viewerRight.viewer) {
      return;
    }

    const leftBaseLayer =
      this.viewerLeft.viewer?.imageryLayers.addImageryProvider(
        baseMapImageryProvider,
        0,
      );

    const rightBaseLayer =
      this.viewerRight.viewer?.imageryLayers.addImageryProvider(
        baseMapImageryProvider,
        0,
      );

    this.viewerLeft.viewer.scene.globe.baseColor = Color.fromCssColorString(
      ColorCodes.MapBackground,
    );
    this.viewerRight.viewer.scene.globe.baseColor = Color.fromCssColorString(
      ColorCodes.MapBackground,
    );

    return {
      left: leftBaseLayer,
      right: rightBaseLayer,
    };
  }

  // Zoom Controls.
  zoomToLayer(layer: SwipeMapLayer, isLeftViewer = true) {
    const properties = getLayerMetadata(layer);

    const destination: Cartographic | null = properties?.bounds
      ? Rectangle.center(Rectangle.fromDegrees(...properties.bounds))
      : null;

    if (!destination) {
      return;
    }

    let altitudeAtDestination =
      this.viewerRight.viewer?.scene.globe.getHeight(destination) ?? 0;

    // altitudeAtDestination will be negative if terrain is not available.
    altitudeAtDestination =
      altitudeAtDestination < 0 ? 5000 : altitudeAtDestination + 5000;

    destination.height = altitudeAtDestination;

    if (isLeftViewer) {
      this.viewerLeft.viewer?.camera.flyTo({
        destination: Cartographic.toCartesian(destination),
        duration: 1,
      });
    } else {
      this.viewerRight.viewer?.camera.flyTo({
        destination: Cartographic.toCartesian(destination),
        duration: 1,
      });
    }
  }

  zoomOut() {
    this.zoom(ZoomMode.ZoomOut);
  }

  zoomIn() {
    this.zoom(ZoomMode.ZoomIn);
  }

  reset(bounds?: BoundingBox) {
    if (bounds) {
      this.flyToBounds(bounds);
    } else {
      this.flyHome(1.5);
    }
  }

  /**
   * Flies the camera to the default earth view.
   * @param duration duration in seconds in which the camera will fly to default earth view.
   */
  flyHome(duration?: number) {
    this.viewerLeft.viewer?.camera.flyHome(duration);
  }

  flyToBounds(bounds: BoundingBox) {
    const rectangle = Rectangle.fromDegrees(...bounds);

    const boundingSphere = BoundingSphere.fromRectangle3D(rectangle);

    // Pitch: -90 degrees to look straight down.
    const offset = new HeadingPitchRange(0, -CesiumMath.PI_OVER_TWO, 0);

    this.viewerLeft.viewer?.camera.flyToBoundingSphere(boundingSphere, {
      offset,
    });
  }

  removeAllImageryLayersExceptBase(isLeftViewer = true) {
    if (isLeftViewer) {
      this._leftViewerLayerManager?.removeAllImageryLayersExceptBase();
    } else {
      this._rightViewerLayerManager?.removeAllImageryLayersExceptBase();
    }
  }

  async addMapLayer({
    isLeftViewer = true,
    ...rest
  }: SplitViewerAddMapLayerParams) {
    if (isLeftViewer) {
      return await this._leftViewerLayerManager?.addMapLayer(rest);
    } else {
      return await this._rightViewerLayerManager?.addMapLayer(rest);
    }
  }

  addTerrain(iterationId: string, terrainPath: string, isLeftViewer = true) {
    if (isLeftViewer) {
      this._leftViewerLayerManager.addTerrain(iterationId, terrainPath);
    } else {
      this._rightViewerLayerManager.addTerrain(iterationId, terrainPath);
    }
  }

  removeMapLayer(isLeftViewer = true, mapLayers: ImageryLayer[]) {
    if (isLeftViewer) {
      this._leftViewerLayerManager?.removeImageryLayers(mapLayers);
    } else {
      this._rightViewerLayerManager?.removeImageryLayers(mapLayers);
    }
  }

  resetTerrain(isLeftViewer = true) {
    if (isLeftViewer) {
      this._leftViewerLayerManager.resetTerrainProvider();
    } else {
      this._rightViewerLayerManager.resetTerrainProvider();
    }
  }

  get leftLayerManager() {
    return this._leftViewerLayerManager;
  }

  get rightLayerManager() {
    return this._rightViewerLayerManager;
  }
}
