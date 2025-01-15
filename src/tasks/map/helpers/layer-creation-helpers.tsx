import { toast } from '@aus-platform/design-system';

import Feature, { FeatureLike } from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON.js';
import WKT from 'ol/format/WKT';
import Point from 'ol/geom/Point';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import { XYZ } from 'ol/source';
import VectorSource from 'ol/source/Vector';
import { MapLayerType } from '../enums';
import { greenLineStyle, greenPointStyle } from '../style-constants';
import {
  VectorLayerData,
  ViewLayersDataType,
  WebGLPointsLayerData,
  XYZLayerData,
} from '../types';
import { GCPData, GeotagImageObj, tileLoadFunction } from 'src/shared/api';
import { EnvVariables } from 'src/shared/env-variables';

export const createLayerByType = (
  layerData: ViewLayersDataType,
): WebGLPointsLayer<any> | VectorLayer<any> | TileLayer<any> => {
  const layerCreators = {
    [MapLayerType.Orthomosaic]: createTileLayer,
    [MapLayerType.SurfaceModel]: createTileLayer,
    [MapLayerType.ClippingBoundary]: createVectorLayer,
    [MapLayerType.CroppingRegion]: createVectorLayer,
    [MapLayerType.ReferenceLayer]: createVectorLayer,
    default: createWebGLPointsLayer,
  };

  const creator = layerCreators[layerData.type] || layerCreators.default;
  return creator(layerData);
};

const createTileLayer = (layerData: XYZLayerData) => {
  return new TileLayer({
    source: createXYZSource(layerData),
    extent: layerData.extent,
    properties: {
      rescale: layerData.rescale,
      statistics: layerData.metadata?.statistics,
    },
  });
};

const createVectorLayer = (layerData: VectorLayerData) => {
  return new VectorLayer({
    source: new VectorSource({
      features: createFeaturesFromGeoJson(layerData.sourceData),
    }),
    style: layerData.style,
  });
};

const createWebGLPointsLayer = (layerData: WebGLPointsLayerData) => {
  return new WebGLPointsLayer({
    source: new VectorSource({
      features: createPointFeatures(layerData),
    }),
    extent: layerData.extent,
    style: layerData.style,
  });
};

/**
 * The function `createFeaturesFromGeoJson` converts GeoJSON data into features with specified
 * properties.
 * @param sourceData - The `sourceData` parameter in the `createFeaturesFromGeoJson` function is
 * expected to be an object containing a `features` property, which is an array of GeoJSON features.
 * Each GeoJSON feature should have properties like `geometry`, `type`, and `name`.
 * @returns An array of features created from the GeoJSON source data. Each feature includes geometry,
 * type, and name properties. If the source data is empty or falsy, an empty array is returned.
 */
export const createFeaturesFromGeoJson = (sourceData?: string) => {
  if (!sourceData || sourceData.length === 0) {
    return [];
  }
  try {
    const format = new GeoJSON();
    const features = JSON.parse(sourceData).features;
    return features.map((feature) => {
      const geometry = format.readGeometry(feature.geometry);

      const newFeature = new Feature({
        geometry,
        label: feature.properties.label,
      });

      if (feature.geometry.type == 'Point') {
        newFeature.setStyle(greenPointStyle);
      } else {
        newFeature.setStyle(greenLineStyle);
      }
      return newFeature;
    });
  } catch {
    toast.error('Cannot load Geojson data');
  }
};

const createXYZSource = (layerData: XYZLayerData) => {
  const { type, key, rescale, epsgCRS } = layerData;

  const tileTypeConfigs = {
    [MapLayerType.Orthomosaic]: `${EnvVariables.tileServerUrl}/ortho/{z}/{x}/{y}.png?key=${key}`,
    [MapLayerType.SurfaceModel]: `${EnvVariables.tileServerUrl}/histogram/{z}/{x}/{y}.png?rescale=${rescale}&key=${key}&horizontal_crs=${epsgCRS}`,
  };

  const url = tileTypeConfigs[type];
  return new XYZ({
    url,
    crossOrigin: 'Anonymous',
    tileLoadFunction,
    maxZoom: 22,
  });
};

const hasValidLocationWgs84 = (
  point: GeotagImageObj | GCPData,
): point is (GeotagImageObj | GCPData) & { locationWgs84: string } => {
  return point.locationWgs84 != null;
};

/**
 * The function `createPointFeatures` generates point features based on the input layer data, handling
 * different data structures for geotagged objects.
 * @param {WebGLPointsLayerData} layerData - The `createPointFeatures` function takes in a parameter
 * `layerData` of type `WebGLPointsLayerData`. This parameter contains information about the type of
 * data and the source data for the points layer.
 * @returns The `createPointFeatures` function returns an array of `Feature` objects based on the
 * `layerData` provided and returns properties based on the type of layer.
 */
const createPointFeatures = (layerData: WebGLPointsLayerData) => {
  const { type, sourceData, showActionButton, onClick } = layerData;
  return sourceData
    .filter((point) => hasValidLocationWgs84(point))
    .map((point) => {
      const name =
        'filename' in point
          ? (point as GeotagImageObj).filename
          : (point as GCPData).label;
      const locationWgs84 = point.locationWgs84.replace(/SRID=\d+;/, '');
      return new Feature({
        id: point.id,
        geometry: new WKT().readGeometry(locationWgs84) as Point,
        name,
        type,
        showActionButton,
        onClick,
      }) as FeatureLike;
    });
};
