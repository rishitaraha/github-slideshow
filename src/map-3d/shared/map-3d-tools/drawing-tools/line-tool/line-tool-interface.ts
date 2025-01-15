import {
  ExportedWKTType,
  Line,
  LineDrawingTools,
  StyleOptions,
} from '@aus-platform/cesium';
import { Feature } from '../../../../../shared/api';
import { ListenerTypes } from '../../types';
import { IBaseTool } from '../../base-tool';
import { LineToolEventListener } from './types';
import { LineEventType } from './enums';

export interface Lines {
  [id: string]: Line;
}

export interface ILineTool extends IBaseTool {
  activate: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableEditing?: boolean,
    enableDefaultListeners?: boolean,
  ) => void;
  deactivate: VoidFunction;
  getLine: (id: string) => Line | null;

  /**
   * The function `getLines` returns an array of `Line` objects stored in the `currentDrawnLines`
   * property.
   * @returns An array of all current drawn lines.
   */
  getLines: () => Line[];

  getLinesByProperty: (propertyKey: string, propertyValue: any) => Line[];
  deleteLine: (id: string) => void;
  deleteAllCurrentLines: VoidFunction;
  deleteAllEditedLines: VoidFunction;
  deleteAllLoadedLines: VoidFunction;
  deleteAllLines: VoidFunction;
  deleteById: (lineId: string) => void;
  // TODO: Refactor params in aereo-cesium package.
  importWKT: (
    wktString: string,
    lineId: string,
    properties: Record<string, any>,
    lineLabel?: string,
    styleOptions?: StyleOptions,
  ) => Line[] | undefined;
  exportCurrentLinesToWKT: () => ExportedWKTType[];
  exportCurrentLinesToFeaturesArray: (layerId: string) => Feature[];
  exportEditedLinesToFeaturesArray: (layerId: string) => Feature[];
  exportDeletedLineIds: () => string[];
  applyStyleToLines: (layerId: string, styleOptions: StyleOptions) => void;
  checkUnsavedLines: () => boolean;
  toggleVisibility: (lineId: string) => void;
  lineHasProperty: (featureId: string, property: string) => boolean;
  getCartographicPositions: (line: Line) => string[][] | undefined;
  destroy: VoidFunction;
  enableSingleLineDrawing: VoidFunction;

  // Listeners.
  activateDefaultListeners: (listeners?: ListenerTypes) => void;
  removeDefaultListeners: VoidFunction;
  addEventListener(type: LineEventType, listener: LineToolEventListener): void;
  removeEventListener(
    type: LineEventType,
    listener: LineToolEventListener,
  ): void;

  // Getters.
  lineTool: LineDrawingTools;
  isActive: boolean;
  isAnyLineDrawn: boolean;
  currentDrawnLineIds: string[];
  currentDrawnLines: Lines;
}
