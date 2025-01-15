import { toast } from '@aus-platform/design-system';
import { get } from 'lodash';
import { createEmpty, extend } from 'ol/extent';
import Feature, { FeatureLike } from 'ol/Feature';
import WKT from 'ol/format/WKT';
import { Map } from 'ol';
import Point from 'ol/geom/Point';
import WebGLPointsLayer from 'ol/layer/WebGLPoints';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { MapLayerType } from '../enums';

import {
  CheckpointTaggedStyle,
  CheckpointUntaggedStyle,
  GcpTaggedStyle,
  GcpUntaggedStyle,
  GeotagImageBlueIconStyle,
} from '../style-constants';
import {
  CreateMapComponentProps,
  MapComponentProps,
  ViewLayersDataType,
  ViewLayerType,
  WebGLPointsLayerData,
  XYZLayerData,
} from '../types';
import { baseMapLayer, createLayerByType, getFilteredGcpTypesList } from './';
import { GeotagImageObj } from 'src/shared/api';

/**
 * Generates the map component properties, including view layers and metadata for a given dataset.
 *
 * @param {Object} params - The parameters for creating the map component properties.
 * @param {IterationDataset} params.dataset - The dataset object.
 * @param {Object} params.geotagImageDetails - Details about geotagged images.
 * @param {GeotagImageObj[]} params.geotagImageDetails.items - List of geotagged images.
 * @param {boolean} params.geotagImageDetails.showActionButton - Whether to show the action button for geotagged images.
 * @param {Function} params.geotagImageDetails.onClick - Callback function for geotagged image interactions.
 * @param {Object} params.gcpDetails - Details about ground control points (GCPs).
 * @param {GCPData[]} params.gcpDetails.items - List of GCPs.
 * @param {boolean} params.gcpDetails.showActionButton - Whether to show the action button for GCPs.
 * @param {Function} params.gcpDetails.onClick - Callback function for GCP interactions.
 * @param {COGMetadataType} [params.dsmMetadata] - DSM metadata.
 * @param {COGMetadataType} [params.orthoMetadata] - Orthomosaic metadata.
 *
 * @returns {MapComponentProps} The map component properties.
 */
export const createMapComponentProps = ({
  dataset,
  geotagImageDetails,
  gcpDetails,
  dsmMetadata,
  orthoMetadata,
}: CreateMapComponentProps): MapComponentProps => {
  const viewLayers: ViewLayerType[] = [
    {
      type: MapLayerType.Satellite,
      visible: true,
      isExtent: false,
      zIndex: 0,
      layer: baseMapLayer,
    }, // Add satellite base layer.
  ];

  const getDatasetKey = (key: string) =>
    dataset.hasOwnProperty(key) ? (dataset as any)[key] : null;

  const demKey = getDatasetKey('outputDemCogS3ObjectKey');
  const orthoKey = getDatasetKey('outputOrthoCogS3ObjectKey');
  const epsgCode = 'EPSG:3857'; // TODO: Get epsg code from dataset in case of task / merged dataset.

  // Add layers to the view
  const addLayer = (layerData: ViewLayersDataType) => {
    try {
      const layer = createLayerByType(layerData);
      if (layer) {
        viewLayers.push({
          type: layerData.type,
          name: layerData.name ?? layerData.type,
          visible: true,
          layer,
          zIndex: layerData.zIndex ?? 0,
          isExtent: layerData.isExtent ?? false,
          extent: layerData.extent ?? createEmpty(),
        });
      }
    } catch (error) {
      toast.error(`Failed to add: ${layerData.type} to map`);
      console.error(`Error adding layer ${layerData.type}:`, error);
    }
  };

  // Add Orthomosaic and DSM layers
  if (orthoKey && orthoMetadata) {
    const extent = get(orthoMetadata, 'bounds', [0, 0, 0, 0]);
    const minValue = get(orthoMetadata, 'statistics.b1.min', 0);
    const maxValue = get(orthoMetadata, 'statistics.b1.max', 0);
    const rescale = `${Math.round(minValue)},${Math.round(maxValue)}`;
    addLayer({
      type: MapLayerType.Orthomosaic,
      key: orthoKey,
      metadata: orthoMetadata,
      extent,
      rescale,
      epsgCRS: epsgCode,
    } as XYZLayerData);
  }

  if (demKey && dsmMetadata) {
    const extent = get(dsmMetadata, 'bounds', [0, 0, 0, 0]);
    const minValue = get(dsmMetadata, 'statistics.b1.min', 0);
    const maxValue = get(dsmMetadata, 'statistics.b1.max', 0);
    const rescale = `${Math.round(minValue)},${Math.round(maxValue)}`;
    addLayer({
      type: MapLayerType.SurfaceModel,
      key: demKey,
      metadata: dsmMetadata,
      extent,
      rescale,
      epsgCRS: epsgCode,
    } as XYZLayerData);
  }

  // Add GCP layers
  if (gcpDetails.items.length > 0) {
    const { items, showActionButton, onClick } = gcpDetails;
    const { taggedGcp, untaggedGcp, taggedCheckpoint, untaggedCheckpoint } =
      getFilteredGcpTypesList(items);

    if (taggedGcp.length > 0) {
      addLayer({
        type: MapLayerType.GCP,
        sourceData: taggedGcp,
        style: GcpTaggedStyle,
        visible: true,
        isExtent: false,
        zIndex: 10,
        showActionButton,
        onClick,
      } as WebGLPointsLayerData);
    }

    if (untaggedGcp.length > 0) {
      addLayer({
        type: MapLayerType.UntaggedGCP,
        sourceData: untaggedGcp,
        style: GcpUntaggedStyle,
        visible: true,
        isExtent: false,
        zIndex: 10,
        showActionButton,
        onClick,
      } as WebGLPointsLayerData);
    }

    if (taggedCheckpoint.length > 0) {
      addLayer({
        type: MapLayerType.Checkpoint,
        sourceData: taggedCheckpoint,
        style: CheckpointTaggedStyle,
        visible: true,
        isExtent: false,
        zIndex: 10,
        showActionButton,
        onClick,
      } as WebGLPointsLayerData);
    }

    if (untaggedCheckpoint.length > 0) {
      addLayer({
        type: MapLayerType.UntaggedCheckpoint,
        sourceData: untaggedCheckpoint,
        style: CheckpointUntaggedStyle,
        visible: true,
        isExtent: false,
        zIndex: 10,
        showActionButton,
        onClick,
      } as WebGLPointsLayerData);
    }
  }

  // Add Geotag layers
  if (geotagImageDetails.items.length > 0) {
    const { items, showActionButton, onClick } = geotagImageDetails;
    const coords = items.map((geotag) =>
      new WKT().readGeometry(geotag.locationWgs84.replace(/SRID=\d+;/, '')),
    );
    // Initialize an empty extent
    const overallExtent = createEmpty();

    // Extend the extent for each geometry
    coords.forEach((geometry) => {
      extend(overallExtent, geometry.getExtent());
    });

    addLayer({
      type: MapLayerType.Geotag,
      sourceData: items,
      style: GeotagImageBlueIconStyle,
      visible: true,
      isExtent: true,
      zIndex: 10,
      extent: overallExtent,
      showActionButton,
      onClick,
    } as WebGLPointsLayerData);
  }

  const mapComponentProps: MapComponentProps = {
    viewLayers,
  };

  if (demKey) {
    mapComponentProps.demS3ObjectKey = demKey;
  }

  return mapComponentProps;
};

export const addGeotagPointsToMapHandler = (
  sourceData: {
    items: GeotagImageObj[];
    showActionButton: boolean;
    onClick: (event: unknown) => void;
  },
  mapComponentProps: MapComponentProps,
) => {
  if (mapComponentProps) {
    const { viewLayers } = mapComponentProps;
    viewLayers.forEach((layer) => {
      switch (layer.type) {
        case MapLayerType.Geotag:
          const { items, showActionButton, onClick } = sourceData;
          const features = items.map(
            (point) =>
              new Feature({
                id: point.id,
                name: point.filename,
                geometry: new WKT().readGeometry(
                  point.locationWgs84.replace(/SRID=\d+;/, ''),
                ) as Point,
                type: MapLayerType.Geotag,
                showActionButton,
                onClick,
              }) as FeatureLike,
          );
          (layer.layer as WebGLPointsLayer<VectorSource<any>>)
            .getSource()
            ?.addFeatures(features);
          break;
      }
    });
  }
};

export const createViewLayer = (options: {
  type: string;
  visible: boolean;
  isExtent: boolean;
  zIndex: number;
  extent?: number[];
}) => {
  const layer = new VectorLayer({
    source: new VectorSource({}),
    zIndex: options.zIndex,
  });
  layer.setVisible(options.visible);
  return {
    layer,
    visible: options.visible,
    isExtent: options.isExtent,
    extent: options.extent,
  };
};

export const clearMeasureTooltips = (map: Map) => {
  const tooltips = document.querySelectorAll('.ol-tooltip');
  tooltips.forEach((tooltip) => tooltip.remove());
  map.getOverlays().clear();
};
