import {
  CesiumViewer,
  StyleOptions,
  Textbox,
  TextTool,
} from '@aus-platform/cesium';
import { isEmpty, isNil, isUndefined } from 'lodash';
import { Feature, FeatureType } from '../../../../../shared/api';
import { BaseTool } from '../../base-tool';
import { ListenerTypes } from '../../types';
import { defaultListenerTypes } from '../constants';
import { TextboxEventType } from './enums';
import { ITextboxTool, Textboxes } from './textbox-tool-interface';
import { TextboxToolEventListener } from './types';

export class TextboxTool extends BaseTool implements ITextboxTool {
  private _loadedTextboxes: Textboxes = {};
  private _currentDrawnTextboxes: Textboxes = {};
  private _currentDirtyTextboxes: Textboxes = {};
  private _currentDeletedTextboxIds = {};
  private _textboxTool: TextTool;
  private _isActive = false;

  constructor(viewer: CesiumViewer) {
    super(viewer);
    this._textboxTool = this.viewer.textTool;
  }

  activate(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    enableDefaultListeners = true,
  ) {
    this._isActive = true;
    this._textboxTool.activateTextDraw(
      properties,
      styleOptions,
      { canDelete: true },
      { canSelect: true },
    );
    if (enableDefaultListeners) {
      this.activateDefaultListeners();
    }
  }

  deactivate() {
    this._isActive = false;
    this.viewer.deactivateCurrentMapTool();
    this.removeDefaultListeners();
  }

  createTextbox(text: string) {
    const textbox = this._textboxTool.textDraw.createTextbox(text);
    this._currentDrawnTextboxes[textbox.id] = textbox;
  }

  getTextbox(id: string): Textbox | null {
    return this._textboxTool.textDraw.getTextboxById(id) ?? null;
  }

  getTextboxesByProperty(propertyKey: any, propertyValue: any) {
    return this._textboxTool.getTextboxesByProperty(propertyKey, propertyValue);
  }

  toggleVisibility(textboxId: string) {
    return this._textboxTool.toggleVisibility(textboxId);
  }

  resetCurrentDrawnArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDrawnTextboxes).forEach((textbox) => {
        this._loadedTextboxes[textbox.id] = textbox;
      });
      this._currentDrawnTextboxes = {};
    } else {
      this.deleteAllCurrentTextboxes();
    }
  }

  resetCurrentEditArray(saveFeatures?: boolean) {
    if (saveFeatures) {
      Object.values(this._currentDirtyTextboxes).forEach((textbox) => {
        this._loadedTextboxes[textbox.id] = textbox;
      });
    }
    this._currentDirtyTextboxes = {};
  }

  resetCurrentDeletedArray() {
    this._currentDeletedTextboxIds = {};
  }

  resetStyle() {
    this._textboxTool.textDraw.resetDrawingStyle();
  }

  deleteById(id: string) {
    this._textboxTool.textDraw.deleteTextBox(id);
  }

  deleteAllCurrentTextboxes() {
    Object.values(this._currentDrawnTextboxes).forEach((textbox) => {
      this._textboxTool.textDraw.deleteTextBox(textbox.id);
    });
    this._currentDrawnTextboxes = {};
  }

  deleteAllEditedTextboxes() {
    Object.values(this._currentDirtyTextboxes).forEach((textbox) => {
      this._textboxTool.textDraw.deleteTextBox(textbox.id);
    });
    this._currentDirtyTextboxes = {};
  }

  deleteAllLoadedTextboxes() {
    Object.values(this._loadedTextboxes).forEach((textbox) => {
      this._textboxTool.textDraw.deleteTextBox(textbox.id);
    });
    this._loadedTextboxes = {};
  }

  deleteAllTextboxes() {
    this.deleteAllEditedTextboxes();
    this.deleteAllCurrentTextboxes();
    this.deleteAllLoadedTextboxes();
  }

  applyStyleToTextboxes(layerId: string, styleOptions: StyleOptions) {
    const textboxes = this.getTextboxesByProperty('layerId', layerId);
    this._textboxTool.textDraw.setStyleOptions(styleOptions);
    if (textboxes.length > 0) {
      textboxes.forEach((textbox) => {
        textbox.changeStyle(styleOptions);
      });
    }
  }

  importWKT(
    wktString: string,
    textBoxText: string,
    textBoxId: string,
    properties: Record<string, any>,
    styleOptions?: StyleOptions | undefined,
  ): Textbox[] | undefined {
    const textboxes = this._textboxTool.importWkt(
      [{ id: textBoxId, wkt: wktString, text: textBoxText }],
      [textBoxId],
      undefined,
      [properties],
      styleOptions,
    );
    if (!isUndefined(textboxes) && !isEmpty(textboxes)) {
      textboxes.forEach((textbox) => {
        this._loadedTextboxes[textbox.id] = textbox;
      });
    }
    return textboxes;
  }

  exportCurrentTextboxesToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];

    Object.values(this._currentDrawnTextboxes).forEach((textbox) => {
      const wktArray = this.textboxTool.exportWKT([textbox.id]);

      if (wktArray && wktArray[0].wkt) {
        const feature: Feature = {
          id: textbox.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          type: FeatureType.Textbox,
          properties: { text: wktArray[0].text },
        };

        feature.feature = textbox;

        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportEditedTextBoxesToFeaturesArray(layerId: string): Feature[] {
    const featuresArray: Feature[] = [];

    Object.values(this._currentDirtyTextboxes).forEach((textbox) => {
      const wktArray = this._textboxTool.exportWKT([textbox.id]);

      if (wktArray && wktArray[0].wkt) {
        const feature: any = {
          id: textbox.id,
          layer: layerId,
          geometry: wktArray[0].wkt,
          properties: { text: wktArray[0].text },
        };

        feature.feature = textbox;
        featuresArray.push(feature);
      }
    });

    return featuresArray;
  }

  exportDeletedTextboxIds(): string[] {
    return Object.keys(this._currentDeletedTextboxIds);
  }

  checkUnsavedTextboxes(): boolean {
    return (
      Object.keys(this._currentDrawnTextboxes).length > 0 ||
      Object.keys(this._currentDirtyTextboxes).length > 0 ||
      Object.keys(this._currentDeletedTextboxIds).length > 0
    );
  }

  textboxHasProperty(featureId: string, property: string) {
    return !isNil(this.getTextbox(featureId)?.properties[property]);
  }

  // Default Listeners.
  private _defaultTextboxCreatedListener(textboxes: Textbox[]) {
    if (!isUndefined(this._currentDirtyTextboxes[textboxes[0].id])) {
      delete this._currentDirtyTextboxes[textboxes[0].id];
    }
    if (isUndefined(this._currentDrawnTextboxes[textboxes[0].id])) {
      this._currentDrawnTextboxes[textboxes[0].id] = textboxes[0];
    }
  }

  private _defaultTextboxEditedListener(textboxes: Textbox[]) {
    if (
      isUndefined(this._currentDirtyTextboxes[textboxes[0].id]) &&
      isUndefined(this._currentDrawnTextboxes[textboxes[0].id])
    ) {
      this._currentDirtyTextboxes[textboxes[0].id] = textboxes[0];
    }
  }

  private _defaultTextboxDeletedListener(idArray: string[]) {
    // Remove deleted textbox from drawn textboxes array if any.
    if (!isUndefined(this._currentDrawnTextboxes[idArray[0]])) {
      delete this._currentDrawnTextboxes[idArray[0]];
    }

    // Remove deleted textbox from dirty textboxes array if any.
    if (!isUndefined(this._currentDirtyTextboxes[idArray[0]])) {
      delete this._currentDirtyTextboxes[idArray[0]];
    }

    // Remove deleted textbox from loaded textboxes array if any.
    if (!isUndefined(this._loadedTextboxes[idArray[0]])) {
      delete this._loadedTextboxes[idArray[0]];
    }

    if (isUndefined(this._currentDeletedTextboxIds[idArray[0]])) {
      this._currentDeletedTextboxIds[idArray[0]] = idArray[0];
    }
  }

  activateDefaultListeners(listeners: ListenerTypes = defaultListenerTypes) {
    if (listeners.create) {
      this._textboxTool.textDraw.eventCreatedTextboxDraw.addEventListener(
        this._defaultTextboxCreatedListener,
        this,
      );
    }

    if (listeners.edit) {
      this._textboxTool.textDraw.eventModifiedTextboxDraw.addEventListener(
        this._defaultTextboxEditedListener,
        this,
      );
    }

    if (listeners.delete) {
      this.textboxTool.textDraw.eventDeletedTextboxDraw.addEventListener(
        this._defaultTextboxDeletedListener,
        this,
      );
    }
  }

  removeDefaultListeners() {
    this._textboxTool.textDraw.eventCreatedTextboxDraw.removeEventListener(
      this._defaultTextboxCreatedListener,
      this,
    );
    this._textboxTool.textDraw.eventModifiedTextboxDraw.removeEventListener(
      this._defaultTextboxEditedListener,
      this,
    );
    this.textboxTool.textDraw.eventDeletedTextboxDraw.removeEventListener(
      this._defaultTextboxDeletedListener,
      this,
    );
  }

  // Listeners.
  addEventListener(type: TextboxEventType, listener: TextboxToolEventListener) {
    switch (type) {
      case TextboxEventType.TextboxCreated: {
        return this._textboxTool.textDraw.eventCreatedTextboxDraw.addEventListener(
          listener,
        );
      }
      case TextboxEventType.TextboxModified: {
        return this._textboxTool.textDraw.eventModifiedTextboxDraw.addEventListener(
          listener,
        );
      }
      case TextboxEventType.TextboxDeleted: {
        return this._textboxTool.textDraw.eventDeletedTextboxDraw.addEventListener(
          listener,
        );
      }
      case TextboxEventType.ReadyTextboxDraw: {
        return this._textboxTool.textDraw.eventReadyTextboxDraw.addEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  removeEventListener(
    type: TextboxEventType,
    listener: TextboxToolEventListener,
  ) {
    switch (type) {
      case TextboxEventType.TextboxCreated: {
        return this._textboxTool.textDraw.eventCreatedTextboxDraw.removeEventListener(
          listener,
        );
      }
      case TextboxEventType.TextboxModified: {
        return this._textboxTool.textDraw.eventModifiedTextboxDraw.removeEventListener(
          listener,
        );
      }
      case TextboxEventType.TextboxDeleted: {
        return this._textboxTool.textDraw.eventDeletedTextboxDraw.removeEventListener(
          listener,
        );
      }
      default: {
        throw new Error('Invalid event type');
      }
    }
  }

  // Getter.
  get textboxTool() {
    return this._textboxTool;
  }

  get isActive() {
    return this._isActive;
  }

  get loadedFeatureIds() {
    return Object.keys(this._loadedTextboxes);
  }

  destroy() {
    this.deactivate();
    this.resetCurrentDeletedArray();
    this.deleteAllTextboxes();
    this._textboxTool.destroy();
  }
}
