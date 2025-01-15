import { StyleOptions, TextTool, Textbox } from '@aus-platform/cesium';
import { Feature } from '../../../../../shared/api';
import { ListenerTypes } from '../../types';
import { IBaseTool } from '../../base-tool';
import { TextboxToolEventListener } from './types';
import { TextboxEventType } from './enums';

export interface Textboxes {
  [id: string]: Textbox;
}

export interface ITextboxTool extends IBaseTool {
  activate: (
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableDefaultListeners?: boolean,
  ) => void;
  deactivate: VoidFunction;
  createTextbox: (text: string) => void;
  getTextbox: (id: string) => Textbox | null;
  resetStyle: VoidFunction;
  deleteAllCurrentTextboxes: VoidFunction;
  deleteAllEditedTextboxes: VoidFunction;
  deleteAllLoadedTextboxes: VoidFunction;
  deleteAllTextboxes: VoidFunction;
  applyStyleToTextboxes: (layerId: string, styleOptions: StyleOptions) => void;
  // TODO: Refactor params in aereo-cesium package.
  importWKT: (
    wktString: string,
    textBoxText: string,
    textBoxId: string,
    properties: Record<string, any>,
    styleOptions?: StyleOptions,
  ) => Textbox[] | undefined;
  exportCurrentTextboxesToFeaturesArray: (layerId: string) => Feature[];
  exportEditedTextBoxesToFeaturesArray: (layerId: string) => Feature[];
  exportDeletedTextboxIds: () => string[];
  checkUnsavedTextboxes: () => boolean;
  getTextboxesByProperty: (propertyKey: any, propertyValue: any) => Textbox[];
  toggleVisibility: (textboxId: string) => void;
  textboxHasProperty: (featureId: string, property: string) => boolean;
  deleteById: (id: string) => void;
  destroy: VoidFunction;

  // Listeners.
  activateDefaultListeners: (listeners?: ListenerTypes) => void;
  removeDefaultListeners: VoidFunction;
  addEventListener(
    type: TextboxEventType,
    listener: TextboxToolEventListener,
  ): void;
  removeEventListener(
    type: TextboxEventType,
    listener: TextboxToolEventListener,
  ): void;

  // Getters.
  textboxTool: TextTool;
  isActive: boolean;
}
