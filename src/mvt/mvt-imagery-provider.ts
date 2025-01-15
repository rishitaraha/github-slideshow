import * as mapbox from 'mvt-basic-render';
import {
  Credit,
  DefaultProxy,
  Event,
  GeographicTilingScheme,
  Math as CesiumMath,
  Rectangle,
  WebMercatorTilingScheme,
  Cartographic,
  Resource,
  ImageryLayerFeatureInfo,
} from 'cesium';

import {
  MVTCoords,
  MVTImageryProviderOptions,
  StyleSpecification,
} from './types';

import { generateFocusedLayers } from './helpers';
import { FocusedLayerId } from './enums';
/*
  Please don't confuse the term `layer` used in mvt dir with cesium layer.
  These terms are referring to the mapbox layer not cesium layer.
  *
  There is a difference between Cesium Layer and Mapbox GL JS Layer:
  - **Cesium Layer**: Typically refers to different types of geospatial data in a 3D map.
    Used for 3D mapping, simulations, and geospatial apps.
  - **Mapbox GL JS Layer**: Refers to how data is styled and displayed on a 2D map.
    Used for creating interactive, customizable 2D maps for web applications.
    Ref: https://developers.arcgis.com/documentation/glossary/layer-mapbox/#:~:text=A%20layer%20in%20Mapbox%20GL,text%2C%20icons%2C%20or%20both.
*/

// Create a global variable for base canvas to avoid the browser limitation of 16 canvas contexts.
const baseCanvas = document.createElement('canvas');

export class MVTImageryProvider {
  mapboxRenderer: any;
  ready: boolean;
  readyPromise: Promise<any>;
  rectangle: Rectangle;
  tileSize: number;
  tileWidth: number;
  tileHeight: number;
  maxzoom: number;
  minzoom: number;
  tileDiscardPolicy: undefined;
  credit: Credit;
  proxy: DefaultProxy;
  hasAlphaChannel: boolean;
  sourceFilter: any;
  tilingScheme: WebMercatorTilingScheme | GeographicTilingScheme;
  errorEvent: Event;
  boundingRectangle?: Rectangle;
  private _destroyed = false;
  private _style: string | Resource | StyleSpecification;
  private _accessToken: string | undefined;
  private _enablePickFeatures: boolean | undefined;

  constructor(options: MVTImageryProviderOptions) {
    this._style = options.style;
    this._accessToken = options.accessToken;
    this._enablePickFeatures = options.enablePickFeatures ?? true;

    this.ready = false;
    this.tilingScheme = options.tilingScheme ?? new WebMercatorTilingScheme();
    this.rectangle = this.tilingScheme.rectangle;
    this.tileSize = this.tileWidth = this.tileHeight = options.tileSize || 512;
    this.maxzoom = options.maxzoom ?? Number.MAX_SAFE_INTEGER;
    this.minzoom = options.minzoom ?? 0;
    this.tileDiscardPolicy = undefined;
    this.errorEvent = new Event();
    this.credit = new Credit(options.credit || '', false);
    this.proxy = new DefaultProxy('');
    this.hasAlphaChannel = options.hasAlphaChannel ?? true;
    this.sourceFilter = options.sourceFilter;
    this.boundingRectangle = options.bounds
      ? Rectangle.fromDegrees(...options.bounds)
      : undefined;

    this.mapboxRenderer = new mapbox.BasicRenderer({
      style: this._style,
      canvas: baseCanvas,
      token: this._accessToken,
      requestTransformFn: options.requestTransformFn,
      transformRequest: options.transformRequest,
    });
    this.readyPromise = this.mapboxRenderer._style.loadedPromise;

    if (options.showCanvas) {
      this.mapboxRenderer.showCanvasForDebug();
    }

    this.readyPromise.then(() => {
      this.ready = true;
    });
  }

  get style() {
    return this._style;
  }

  get isDestroyed() {
    return this._destroyed;
  }

  private _createTile(): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = this.tileSize;
    canvas.height = this.tileSize;
    canvas.style.imageRendering = 'pixelated';
    const context = canvas.getContext('2d');
    if (context) {
      context.globalCompositeOperation = 'copy';
    }
    return canvas;
  }

  /**
   * Generates an array of tile specifications for a 3x3 grid of tiles centered around the given coordinates.
   * @param centerCoordinates - The coordinates of the center tile.
   * @param source - The source from which tiles will be fetched.
   * @returns An array of tile specifications.
   */
  private _getTilesSpec(centerCoordinates: MVTCoords, source: any) {
    const { x: centerX, y: centerY, zoom } = centerCoordinates;
    const TILE_SIZE = this.tileSize;

    const tilesSpecArray: any[] = [];

    // Calculate the maximum tile index for the given zoom level.
    const maxXTilesIndex = this.tilingScheme.getNumberOfXTilesAtLevel(zoom) - 1;
    const maxYTilesIndex = this.tilingScheme.getNumberOfYTilesAtLevel(zoom) - 1;

    // Iterate over a 3x3 grid of tiles centered around the provided coordinates.
    for (let xOffset = -1; xOffset <= 1; xOffset++) {
      // Adjust the x-coordinate for tiles at the edges of the grid.
      let adjustedX = centerX + xOffset;
      if (adjustedX < 0) {
        adjustedX = maxXTilesIndex;
      }
      if (adjustedX > maxXTilesIndex) {
        adjustedX = 0;
      }

      for (let yOffset = -1; yOffset <= 1; yOffset++) {
        // Adjust the y-coordinate for tiles at the edges of the grid.
        const adjustedY = centerY + yOffset;

        // Skip tiles outside the valid range.
        if (adjustedY < 0 || adjustedY > maxYTilesIndex) {
          continue;
        }

        // Skip tile outside of the given bounds.
        if (this.boundingRectangle) {
          const tileRectangle = this.tilingScheme.tileXYToRectangle(
            adjustedX,
            adjustedY,
            zoom,
          );

          if (!Rectangle.intersection(this.boundingRectangle, tileRectangle)) {
            continue;
          }
        }

        // Create a tile specification and add it to the array.
        tilesSpecArray.push({
          source: source,
          z: zoom,
          x: adjustedX,
          y: adjustedY,
          left: 0 + xOffset * TILE_SIZE,
          top: 0 + yOffset * TILE_SIZE,
          size: TILE_SIZE,
        });
      }
    }
    return tilesSpecArray;
  }

  private _resetTileCache() {
    Object.values(this.mapboxRenderer._style.sourceCaches).forEach(
      (cache: any) => cache._tileCache.reset(),
    );
  }

  requestImage(
    x: number,
    y: number,
    zoom: number,
    releaseTile = true,
  ): Promise<HTMLCanvasElement | any> {
    if (zoom > this.maxzoom || zoom < this.minzoom) {
      return Promise.reject(
        'The requested tile is outside of specified zoom level',
      );
    }

    this.mapboxRenderer.filterForZoom(zoom);
    const tilesSpec = this.mapboxRenderer
      .getVisibleSources()
      .reduce(
        (a: any, s: any) => a.concat(this._getTilesSpec({ x, y, zoom }, s)),
        [],
      );

    return new Promise((resolve, reject) => {
      const canvas = this._createTile();
      const ctx = canvas.getContext('2d');
      const renderRef = this.mapboxRenderer.renderTiles(
        ctx,
        {
          srcLeft: 0,
          srcTop: 0,
          width: this.tileSize,
          height: this.tileSize,
          destLeft: 0,
          destTop: 0,
        },
        tilesSpec,
        (err: any) => {
          /**
          In case of an error ending with 'tiles not available,' the canvas will still be painted.
          Related URL: https://github.com/landtechnologies/Mapbox-vector-tiles-basic-js-renderer/blob/master/src/basic/renderer.js#L341-L405
           */
          if (typeof err === 'string' && !err.endsWith('tiles not available')) {
            reject(undefined);
          } else if (releaseTile) {
            renderRef.consumer.ctx = undefined;
            resolve(canvas);
            // releaseTile is true by default, corresponding to Cesium's request for images.
            this.mapboxRenderer.releaseRender(renderRef);
            this._resetTileCache();
          } else {
            // releaseTile is false when manually called by pickFeature, tile is released manually after rendering is completed in pickFeature.
            resolve(renderRef);
          }
        },
      );
    });
  }

  pickFeatures(
    x: number,
    y: number,
    zoom: number,
    longitude: number,
    latitude: number,
  ): Promise<ImageryLayerFeatureInfo[] | undefined> | undefined {
    if (!this.ready || !this._enablePickFeatures) {
      return undefined;
    }

    if (
      this.boundingRectangle &&
      !Rectangle.contains(
        this.boundingRectangle,
        Cartographic.fromRadians(longitude, latitude),
      )
    ) {
      return undefined;
    }

    return this.requestImage(x, y, zoom, false)?.then((renderRef) => {
      let targetSources = this.mapboxRenderer.getVisibleSources(zoom);
      targetSources = this.sourceFilter
        ? this.sourceFilter(targetSources)
        : targetSources;

      const queryResult: ImageryLayerFeatureInfo[] = [];

      const lng = CesiumMath.toDegrees(longitude);
      const lat = CesiumMath.toDegrees(latitude);

      targetSources.forEach((source: any) => {
        const featureInfo = new ImageryLayerFeatureInfo();
        featureInfo.data = this.mapboxRenderer.queryRenderedFeatures({
          source,
          renderedZoom: zoom,
          lng,
          lat,
          tileZ: zoom,
        });
        const name = Object.keys(featureInfo.data)[0];
        featureInfo.name = name;
        const properties: Record<string, any>[] = featureInfo.data[name];
        if (properties) {
          featureInfo.configureDescriptionFromProperties(
            properties?.length === 1 ? properties[0] : properties,
          );
          queryResult.push(featureInfo);
        }
      });

      // Release tile.
      renderRef.consumer.ctx = undefined;
      this.mapboxRenderer.releaseRender(renderRef);
      this._resetTileCache();
      return queryResult.length ? queryResult : undefined;
    });
  }

  applyFocusedFeatureStyle(featureId: string, sourceLayer: string) {
    const visibleSources: string[] = this.mapboxRenderer.getVisibleSources();
    const visibleLayers: string[] = this.mapboxRenderer.getLayersVisible();

    const focusedLayerStyle = generateFocusedLayers(
      featureId,
      visibleSources[0],
      sourceLayer,
    );

    Object.values(focusedLayerStyle).forEach((styledLayer) => {
      if (visibleLayers.includes(styledLayer.id)) {
        this.mapboxRenderer._style.setFilter(
          styledLayer.id,
          styledLayer.filter,
        );
      } else {
        this.mapboxRenderer._style.addLayer(styledLayer);
      }
    });

    this.rerenderStyle();
  }

  removeFocusedFeatureStyle() {
    for (const styleId of Object.values(FocusedLayerId)) {
      this.mapboxRenderer._style.removeLayer(styleId);
    }
    this.rerenderStyle();
  }

  rerenderStyle() {
    this.mapboxRenderer
      ._processConfigQueue(++this.mapboxRenderer._configId)
      // TODO: Find a way to rerender cesium layer instead of reloading.
      // @ts-ignore
      .then(() => this?._reload());
  }

  destroy() {
    this.mapboxRenderer._cancelAllPendingRenders();
    this._resetTileCache();
    this.mapboxRenderer._gl.getExtension('WEBGL_lose_context').loseContext();
    this._destroyed = true;
  }
}
