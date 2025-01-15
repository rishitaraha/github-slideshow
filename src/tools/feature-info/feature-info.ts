import { Event, destroyObject } from 'cesium';
import { MVTImageryProvider } from '../../mvt';
import { MouseButton } from '../../shared';
import { CesiumViewerType, FeatureType } from '../../types';
import { MapTool, MouseEvent, SelectMode } from '../base';
import { FeatureInfoConstructorOptions, SelectedFeature } from './types';

class FeatureInfo extends MapTool {
  private _eventOnFeatureFocus: Event;
  private _eventOnFeatureBlur: Event;
  private _focusedFeature: FeatureType | undefined;
  private _focusedTiledFeatureId: string | undefined;
  private _focusedTiledFeatureImageryProvider: MVTImageryProvider | undefined;

  constructor(options: FeatureInfoConstructorOptions) {
    super(options);
    this._viewer = <CesiumViewerType>options.viewer;

    this._eventOnFeatureBlur = new Event();
    this._eventOnFeatureFocus = new Event();
  }

  get viewer() {
    return this._viewer;
  }

  get eventOnFeatureFocus() {
    return this._eventOnFeatureFocus;
  }

  get eventOnFeatureBlur() {
    return this._eventOnFeatureBlur;
  }

  activateInfoTool() {
    MapTool.multiEditMode = SelectMode.Info;
  }

  deactivate() {
    this.onFeatureBlur();
    this.onTiledFeatureBlur();
  }

  canvasPressEvent(event: MouseEvent): void {
    super.canvasPressEvent(event);

    if (event.button !== MouseButton.LeftButton) {
      return;
    }

    const pickRay = this.viewer.camera.getPickRay(event.pos);

    if (!pickRay) {
      return;
    }

    const featuresPromise = this.viewer.imageryLayers.pickImageryLayerFeatures(
      pickRay,
      this.viewer.scene,
    );

    if (!featuresPromise) {
      this.onTiledFeatureBlur();
      return;
    }

    featuresPromise.then((features) => {
      this.onTiledFeatureBlur();

      for (const feature of features) {
        const mvtImageryProvider = feature.imageryLayer.imageryProvider;

        const mvtSourceLayers = Object.keys(feature.data);

        if (
          mvtImageryProvider instanceof MVTImageryProvider &&
          mvtSourceLayers.length > 0
        ) {
          // We will not be handling multiple sources using Mapbox GL JS; we are using Cesium imagery layers for that. Therefore, there will be only one source layer.
          const sourceLayerName = mvtSourceLayers[0];

          // When multiple features are present at the clicked location, we will select the topmost one.
          const selectedFeatureData: SelectedFeature =
            feature.data[sourceLayerName][0];

          if ('id' in selectedFeatureData) {
            this.onTiledFeatureFocus(
              selectedFeatureData,
              mvtImageryProvider,
              sourceLayerName,
            );
            break;
          }
        }
      }
    });
  }

  onTiledFeatureFocus(
    feature: SelectedFeature,
    mvtImageryProvider: MVTImageryProvider,
    mvtSourceLayerName: string,
  ) {
    if (this._focusedTiledFeatureId) {
      this.onTiledFeatureBlur();
    }

    const { id, type } = feature;
    this._focusedTiledFeatureId = id;
    this._focusedTiledFeatureImageryProvider = mvtImageryProvider;

    mvtImageryProvider.applyFocusedFeatureStyle(id, mvtSourceLayerName);

    this._eventOnFeatureFocus.raiseEvent([id], type);
  }

  onTiledFeatureBlur() {
    if (!this._focusedTiledFeatureId) {
      return;
    }

    if (this._focusedTiledFeatureImageryProvider) {
      this._focusedTiledFeatureImageryProvider.removeFocusedFeatureStyle();
    }

    this._eventOnFeatureBlur.raiseEvent([this._focusedTiledFeatureId]);
    this._focusedTiledFeatureId = undefined;
    this._focusedTiledFeatureImageryProvider = undefined;
  }

  onFeatureFocus(feature: FeatureType) {
    if (this._focusedFeature) {
      this._focusedFeature.featureBlur();
      this._eventOnFeatureBlur.raiseEvent([this._focusedFeature.id]);
    }
    this._focusedFeature = feature;
    feature.featureFocused();
    this._eventOnFeatureFocus.raiseEvent([feature.id], feature.featureType);
  }

  onFeatureBlur() {
    if (!this._focusedFeature) {
      return;
    }

    this._focusedFeature.featureBlur();
    this._eventOnFeatureBlur.raiseEvent([this._focusedFeature.id]);
    this._focusedFeature = undefined;
  }

  destroy() {
    destroyObject(this);
  }
}

export { FeatureInfo };
