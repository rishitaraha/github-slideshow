import {
  ImageryLayer,
  PrimitiveCollection,
  Scene,
  UrlTemplateImageryProvider,
} from 'cesium';
import { CesiumViewerType } from '../../types';
import { CesiumLayerConstructorOptions } from './types';

/**
 * Customized layer
 * Each layer has primitive collections for drawing features and ImageryLayer to show raster data.
 * We can consider a primitive collections as one kind of vector layer containing drawn features.
 * ImageryLayer is just a Cesium ImageryLayer, it can show raster data using url.
 *
 * This customized layer should have primitive collection at least,
 * and the feature could be drawn and raster data is optional.
 */
class CesiumLayer {
  private _name: string;
  private _id: string;
  private _isActive: boolean;
  private _hasRaster: boolean;

  private _viewer: CesiumViewerType;
  private _scene: Scene;
  private _primitiveCollection: PrimitiveCollection;
  private _rasterLayerOptions?: UrlTemplateImageryProvider.ConstructorOptions;
  private _imageryProvider?: UrlTemplateImageryProvider;
  private _imageryLayer?: ImageryLayer;
  private _show: boolean;
  private _properties?: Record<string, any>;
  private _opacity: number;

  constructor(options: CesiumLayerConstructorOptions) {
    this._id = options.id;
    this._name = options.name;
    this._isActive = options.isActive;
    this._hasRaster = options.hasRaster;

    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this._primitiveCollection = new PrimitiveCollection();
    this._show = options.show;
    this._opacity = 1;
    if (options.properties) {
      this._properties = options.properties;
    }

    if (this._hasRaster) {
      this._rasterLayerOptions = options.rasterLayerOptions;
      if (this._rasterLayerOptions) {
        this._imageryProvider = new UrlTemplateImageryProvider(
          this._rasterLayerOptions,
        );
      }
    }
  }

  get name() {
    return this._name;
  }

  set name(value: string) {
    this._name = value;
  }

  get id() {
    return this._id;
  }

  set id(value: string) {
    this._id = value;
  }

  get isActive() {
    return this._isActive;
  }

  set isActive(value: boolean) {
    this._isActive = value;
  }

  get hasRaster() {
    return this._hasRaster;
  }

  set hasRaster(value: boolean) {
    this._hasRaster = value;
  }

  get viewer() {
    return this._viewer;
  }

  get scene() {
    return this._scene;
  }

  get primitiveCollection() {
    return this._primitiveCollection;
  }

  get show() {
    return this._show;
  }

  // Show/Hide
  set show(value: boolean) {
    this._show = value;
    this._primitiveCollection.show = value;
    if (this._hasRaster && this._imageryLayer) {
      this._imageryLayer.show = value;
    }
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any> | undefined) {
    this._properties = properties;
  }

  appendProperties(properties: Record<string, any>) {
    this._properties = { ...this.properties, ...properties };
  }

  get imageryLayer() {
    return this._imageryLayer;
  }

  set imageryLayer(layer: ImageryLayer | undefined) {
    this._imageryLayer = layer;
  }

  get imageryProvider() {
    return this._imageryProvider;
  }

  set imageryProvider(provider: UrlTemplateImageryProvider | undefined) {
    this._hasRaster = true;
    this._imageryProvider = provider;
  }

  set rasterLayerOptions(
    options: UrlTemplateImageryProvider.ConstructorOptions,
  ) {
    this._rasterLayerOptions = options;
  }

  get opacity() {
    return this._opacity;
  }

  set opacity(value: number) {
    if (this._hasRaster && this._imageryLayer) {
      this._imageryLayer.alpha = value;
    }

    const { drawingTools } = this._viewer;
    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } =
      drawingTools;

    const polygons = polygonDrawingTools.polygonDrawing.polygons;
    for (let i = 0; i < polygons.length; i++) {
      if (polygons[i].hasProperty({ layer: this._id })) {
        polygons[i].changeStyle({ polygonStyleOptions: { opacity: value } });
      }
    }

    const lines = lineDrawingTools.lineDrawing.lines;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].hasProperty({ layer: this._id })) {
        lines[i].changeStyle({ lineStyleOptions: { opacity: value } });
      }
    }

    const points = pointDrawingTools.pointDrawing.points;
    for (let i = 0; i < points.length; i++) {
      if (points[i].hasProperty({ layer: this._id })) {
        points[i].changeStyle({ pointStyleOptions: { opacity: value } });
      }
    }
  }
}

export { CesiumLayer };
