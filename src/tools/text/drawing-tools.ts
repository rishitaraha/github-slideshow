import { destroyObject, Ellipsoid } from 'cesium';
import { Textbox } from '../../entities/textbox';
import { EPS } from '../../shared';
import { CesiumViewerType } from '../../types';
import { MapTools } from '../base';
import { ExportedWKTType } from '../drawing';
import { StyleOptions } from '../style';
import { TextboxDraw } from './textbox-draw';

export class TextTool extends MapTools {
  private readonly _textboxDraw: TextboxDraw;

  constructor(options: { viewer: CesiumViewerType; ellipsoid?: Ellipsoid }) {
    super(options);

    this._textboxDraw = new TextboxDraw({
      viewer: options.viewer,
      name: 'TextboxDraw',
      cursorStyle: undefined,
    });
  }

  get textDraw() {
    return this._textboxDraw;
  }

  getTextboxesByProperty(propertyKey: string, propertyValue: any) {
    return this._textboxDraw.textboxes.filter((textbox) => {
      if (
        textbox.properties.hasOwnProperty(propertyKey) &&
        textbox.properties[propertyKey] === propertyValue
      ) {
        return true;
      }

      return false;
    });
  }

  activateTextDraw(
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ) {
    if (properties) {
      this._textboxDraw.properties = properties;
    }

    if (deleteOption) {
      this._textboxDraw.deleteOption = deleteOption;
    }

    if (selectOption) {
      this._textboxDraw.selectOption = selectOption;
    }

    if (styleOptions) {
      this._textboxDraw.setStyleOptions(styleOptions);
    }

    this._viewer.setMapTool?.(this._textboxDraw);
  }

  setLayer(id: string) {
    this._textboxDraw.properties['layer'] = id;
  }

  importWkt(
    wktObject: ExportedWKTType[],
    geometryIds?: (string | undefined)[],
    geometryLabels?: (string | undefined)[],
    properties?: Record<string, any>[],
    styleOptions?: StyleOptions,
    deleteOption = { canDelete: true },
    selectOption = { canSelect: true },
  ): Textbox[] | undefined {
    const viewer = this._viewer;
    if (!viewer) {
      return;
    }

    if (properties && wktObject.length !== properties.length) {
      return;
    }

    const importedGeometries: Textbox[] = [];
    for (let index = 0; index < wktObject.length; index++) {
      let textboxId, textboxLabel;

      if (geometryIds && geometryIds[index]) {
        textboxId = geometryIds[index];
      }

      if (geometryLabels && geometryLabels[index]) {
        textboxLabel = geometryLabels[index];
      }
      const textbox = this._textboxDraw.createTextBoxFromWkt(
        wktObject[index],
        textboxId,
        textboxLabel,
        properties ? properties[index] : undefined,
        styleOptions,
        deleteOption,
        selectOption,
      );

      if (!textbox) {
        continue;
      }

      importedGeometries.push(textbox);
    }

    viewer.camera.moveForward(EPS);
    return importedGeometries;
  }

  toggleVisibility(id: string) {
    const textbox = this._textboxDraw.getTextboxById(id);
    textbox?.toggleVisibility();
  }

  exportWKT(ids: string[]): ExportedWKTType[] | undefined {
    const exportedWkt: ExportedWKTType[] = [];
    for (const id of ids) {
      const textbox = this._textboxDraw.getTextboxById(id);
      if (!textbox) {
        return;
      }

      const wktObject = textbox.exportWKT();

      exportedWkt.push(wktObject);
    }

    return exportedWkt;
  }

  destroy() {
    this._textboxDraw.destroy();
    destroyObject(this);
  }
}
