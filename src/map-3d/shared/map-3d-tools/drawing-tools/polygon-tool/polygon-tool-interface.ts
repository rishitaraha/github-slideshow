import {
  ExportedWKTType,
  Polygon,
  PolygonDrawingTools,
  StyleOptions,
} from '@aus-platform/cesium';
import { Feature } from '../../../../../shared/api';
import { ListenerTypes } from '../../types';
import { GeoJson } from '../types';
import { IBaseTool } from '../../base-tool';
import { PolygonToolEventListener } from './types';
import { PolygonEventType } from './enums';

export interface Polygons {
  [id: string]: Polygon;
}

export interface IPolygonTool extends IBaseTool {
  activate: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableEditing?: boolean,
    enableDefaultListeners?: boolean,
  ) => void;
  deactivate: VoidFunction;
  getPolygon: (id: string) => Polygon | null;
  getPolygonByProperty: (string, any) => Polygon[];
  getAllPolygons: () => Polygon[];

  deleteById: (id: string) => void;
  deletePolygonsByProperty: (propertyKey: string, propertyValue: any) => void;
  deleteAllCurrentPolygons: VoidFunction;
  deleteAllEditedPolygons: VoidFunction;
  deleteAllLoadedPolygons: VoidFunction;
  deleteAllPolygons: VoidFunction;
  exportCurrentPolygonsToFeaturesArray: (layerId: string) => Feature[];
  exportEditedPolygonsToFeaturesArray: (layerId: string) => Feature[];
  exportDeletedPolygonIds: () => string[];
  applyStyleToPolygons: (layerId: string, styleOptions: StyleOptions) => void;
  // TODO: Refactor params in aereo-cesium package.
  importWKT: (
    wktString: string,
    polygonId: string,
    properties: Record<string, any>,
    polygonLabel?: string,
    styleOptions?: StyleOptions,
  ) => Polygon[] | undefined;
  exportPolygonToGeoJSON: (polygonId: string) => GeoJson | undefined;
  exportWkt: (polygonIds: string[]) => ExportedWKTType[] | undefined;
  exportMultiPolygonWkt: (polygonIds: string[]) => string;
  destroy: VoidFunction;
  checkUnsavedPolygons: () => boolean;
  exportCurrentPolygonsToWkt: () => ExportedWKTType[];
  toggleVisibility: (polygonId: string) => void;
  polygonHasProperty: (featureId: string, property: string) => boolean;

  // Listeners.
  activateDefaultListeners: (listeners?: ListenerTypes) => void;
  removeDefaultListeners: VoidFunction;
  addEventListener(
    type: PolygonEventType,
    listener: PolygonToolEventListener,
  ): void;
  removeEventListener(
    type: PolygonEventType,
    listener: PolygonToolEventListener,
  ): void;

  // Getters.
  polygonTool: PolygonDrawingTools;
  isActive: boolean;
  currentDrawnPolygons: Polygons;
  currentDrawnPolygonIds: string[];
  isAnyPolygonDrawn: boolean;
  isAnyPolygonLoaded: boolean;
}
