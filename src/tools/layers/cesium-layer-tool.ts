import { destroyObject, Event, Scene } from 'cesium';
import { CesiumViewerType } from '../../types';
import { clearArray } from '../../utils';
import { CesiumLayer } from './cesium-layer';
import { CesiumLayerConstructorOptions } from './types';
/**
 * Layer management tool (basic for now)
 * - Add Layer
 * - Show/Hide layer (toggling)
 */
class CesiumLayerTool {
  private _layers: CesiumLayer[] = [];
  private _viewer: CesiumViewerType;
  private _activeLayer?: CesiumLayer;
  private _scene: Scene;

  private _eventLayerAdded: Event;
  private _eventActiveLayerChanged: Event;
  private _eventActiveLayerNameChanged: Event;

  constructor(viewer: CesiumViewerType) {
    this._viewer = viewer;
    this._scene = this._viewer.scene;

    this._eventLayerAdded = new Event();
    this._eventActiveLayerChanged = new Event();
    this._eventActiveLayerNameChanged = new Event();
  }

  get layers() {
    return this._layers;
  }

  get eventLayerAdded() {
    return this._eventLayerAdded;
  }

  get eventActiveLayerChanged() {
    return this._eventActiveLayerChanged;
  }

  get eventActiveLayerNameChanged() {
    return this._eventActiveLayerNameChanged;
  }
  get activeLayer() {
    return this._activeLayer;
  }

  get viewer() {
    return this._viewer;
  }

  get scene() {
    return this._scene;
  }

  addLayer(options: CesiumLayerConstructorOptions) {
    const layer = new CesiumLayer(options);
    const { hasRaster, primitiveCollection, imageryProvider } = layer;
    // Add raster layer to cesium viewer if layer has raster data.
    if (hasRaster) {
      const imageryLayers = this._viewer.scene.imageryLayers;
      if (imageryProvider) {
        layer.imageryLayer = imageryLayers.addImageryProvider(imageryProvider);
      }
    }

    // Add primitive collections to cesium viewer.
    // Our custom layer should have primitive collection.
    this._scene.primitives.add(primitiveCollection);

    layer.show = true;
    this.layers.push(layer);
    this._eventLayerAdded.raiseEvent();
  }

  setActiveLayer(id: string) {
    if (id) {
      this._activeLayer = this.layers.find((layer) => layer.id === id);
    } else {
      return;
    }

    if (!this._activeLayer) {
      return;
    }

    this._activeLayer.show = true;
    // Set layer to each drawing tools.
    const drawingTools = this._viewer.drawingTools;
    drawingTools.polygonDrawingTools.setLayer(id);
    drawingTools.lineDrawingTools.setLayer(id);
    drawingTools.pointDrawingTools.setLayer(id);

    this._eventActiveLayerChanged.raiseEvent();
  }

  setActiveLayerName(name: string) {
    if (!this._activeLayer) {
      return;
    }

    this._activeLayer.name = name;
    this._eventActiveLayerNameChanged.raiseEvent();
  }

  toggleVisibility(show: boolean) {
    if (this._activeLayer) {
      for (const layer of this._layers) {
        layer.show = false;
      }
      this._activeLayer.show = show;
    }
  }

  toggleVisibilityById(id: string) {
    const layer = this.layers.find((layer) => layer.id === id);
    if (!layer) {
      return;
    }

    layer.show = !layer.show;
  }

  destroy() {
    clearArray(this._layers);
    destroyObject(this);
  }
}

export { CesiumLayerTool };
