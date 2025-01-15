import {
  destroyObject,
  Scene,
  Event,
  createGuid,
  HorizontalOrigin,
  VerticalOrigin,
  Cartesian2,
  PrimitiveCollection,
  Cartesian3,
  defined,
  SceneMode,
  Cartographic,
  Color,
  BillboardCollection,
} from 'cesium';
import { FeatureIdentity } from '../../types';
import { DrawingMode, ExportedWKTType } from '../drawing';
import { MapTool, MouseEvent } from '../base';
import { TextboxDrawConstructorOptions } from './types';
import { Textbox } from '../../entities/textbox';
import DrawingSettings from '../drawing/drawing-tool-settings';
import { clearArray, pickEntity } from '../../utils';
import { StyleOptions } from '../style';
import { EPS } from '../../shared';

const cartesianScratch = new Cartesian3();

export class TextboxDraw extends MapTool {
  private readonly _scene: Scene;
  private readonly _options: TextboxDrawConstructorOptions;
  private _textboxes: Textbox[];
  private _textbox!: Textbox;
  private _selectedTextbox?: Textbox;
  private _editableTextboxId?: string;
  private _lastClickPosition!: Cartesian3;
  private _mode: DrawingMode;
  private _primitives: PrimitiveCollection;
  private _labelCollection: BillboardCollection;

  // Custom properties.
  private _properties: Record<string, any> = {};
  // Style Options
  private _styleOptions?: StyleOptions;
  private _defaultStyle: StyleOptions;
  private _isUseStyleOptions = false;
  // Delete option
  private _deleteOption?: Record<string, any>;
  // Select option
  private _selectOption?: Record<string, any>;

  private readonly _eventReadyTextboxDraw: Event;
  private readonly _eventCreatedTextboxDraw: Event;
  private readonly _eventModifiedTextboxDraw: Event;
  private readonly _eventStyleChangedTextboxDraw: Event;
  private readonly _eventDeletedTextboxDraw: Event;
  private readonly _eventDeletedAllTextboxDraw: Event;

  private _isDragInEdit = false;
  private _isDragInDraw = false;
  private _wasPanned = false;

  constructor(options: TextboxDrawConstructorOptions) {
    super(options);

    this._viewer = options.viewer;
    this._scene = this._viewer.scene;
    this._options = options;
    this._mode = DrawingMode.None;
    this._primitives = this._scene.primitives;

    if (options.properties) {
      this._properties = options.properties;
    }

    this._eventReadyTextboxDraw = new Event();
    this._eventCreatedTextboxDraw = new Event();
    this._eventModifiedTextboxDraw = new Event();
    this._eventStyleChangedTextboxDraw = new Event();
    this._eventDeletedTextboxDraw = new Event();
    this._eventDeletedAllTextboxDraw = new Event();

    this._labelCollection = this._primitives.add(new BillboardCollection());
    this._textboxes = [];

    this._defaultStyle = {
      textboxStyleOptions: {
        fontColor: Color.BLACK.toCssColorString(),
        fontSize: DrawingSettings.labelFontSize,
        backgroundColor:
          DrawingSettings.labelBackgroundColor.toCssColorString(),
        opacity: 1.0,
      },
    };
  }

  get options() {
    return this._options;
  }

  get textboxes() {
    return this._textboxes;
  }

  get mode() {
    return this._mode;
  }

  set mode(value: DrawingMode) {
    this._mode = value;
  }

  get eventReadyTextboxDraw() {
    return this._eventReadyTextboxDraw;
  }

  get eventCreatedTextboxDraw() {
    return this._eventCreatedTextboxDraw;
  }

  get eventModifiedTextboxDraw() {
    return this._eventModifiedTextboxDraw;
  }

  get eventStyleChangedTextboxDraw() {
    return this._eventStyleChangedTextboxDraw;
  }

  get eventDeletedTextboxDraw() {
    return this._eventDeletedTextboxDraw;
  }

  get eventDeletedAllTextboxDraw() {
    return this._eventDeletedAllTextboxDraw;
  }

  get properties() {
    return this._properties;
  }

  set properties(properties: Record<string, any>) {
    this._properties = properties;
  }

  get styleOptions() {
    return this._styleOptions;
  }

  get isUseStyleOptions() {
    return this._isUseStyleOptions;
  }

  get deleteOption() {
    return this._deleteOption;
  }

  set deleteOption(option: Record<string, any> | undefined) {
    this._deleteOption = option;
  }

  get selectOption() {
    return this._selectOption;
  }

  set selectOption(option: Record<string, any> | undefined) {
    this._selectOption = option;
  }

  // Set style options when activation.
  setStyleOptions(styleOptions: StyleOptions) {
    this._styleOptions = styleOptions;
    this.useStyleOptions(true);
  }

  useStyleOptions(flag = true) {
    this._isUseStyleOptions = flag;
  }

  canvasPressEvent(event: MouseEvent): void {
    if (this._mode === DrawingMode.None) {
      return;
    }

    if (this._mode === DrawingMode.BeforeDraw) {
      this._isDragInDraw = true;
    }

    if (this._mode === DrawingMode.EditDraw) {
      super.canvasPressEvent(event);
      this._isDragInEdit = true;
      const selectedId = pickEntity(this._viewer, event);
      if (!selectedId) {
        return;
      }
      const selectedTextBox = this.getTextboxById(selectedId);
      if (!selectedTextBox) {
        return;
      }
      this._selectedTextbox = selectedTextBox;
      this._editableTextboxId = selectedTextBox.id;
      if (this._scene.mode === SceneMode.SCENE3D) {
        this._scene.screenSpaceCameraController.enableRotate = false;
      } else if (this._scene.mode === SceneMode.SCENE2D) {
        this._scene.screenSpaceCameraController.enableTranslate = false;
      }
    }
  }

  canvasReleaseEvent(event: MouseEvent): void {
    if (!event) {
      return;
    }
    if (this._mode === DrawingMode.BeforeDraw && !this._wasPanned) {
      const position = this.getWorldPosition(event.pos, cartesianScratch);
      if (!defined(position) || !position) {
        return;
      }
      this._lastClickPosition = position;
      this._eventReadyTextboxDraw.raiseEvent();
    }
    this._wasPanned = false;
    this._isDragInDraw = false;

    if (this._mode === DrawingMode.EditDraw) {
      this._isDragInEdit = false;
      if (this._scene.mode === SceneMode.SCENE3D) {
        this._scene.screenSpaceCameraController.enableRotate = true;
      } else if (this._scene.mode === SceneMode.SCENE2D) {
        this._scene.screenSpaceCameraController.enableTranslate = true;
      }
      if (this._selectedTextbox) {
        this._selectedTextbox = undefined;
      }
    }
  }

  canvasMoveEvent(event: MouseEvent): void {
    if (this._isDragInDraw) {
      this._wasPanned = true;
    }
    if (this._mode !== DrawingMode.EditDraw) {
      return;
    }
    if (this._isDragInEdit) {
      const position = this.getWorldPosition(event.pos, cartesianScratch);
      if (!position || !this._selectedTextbox) {
        return;
      }
      this._selectedTextbox.updateTextPosition(position);
    }
  }

  activate() {
    super.activate();
    this._mode = DrawingMode.BeforeDraw;
    return true;
  }

  deactivate() {
    super.deactivate();
    this._mode = DrawingMode.None;
  }

  createTextBoxFromWkt(
    wktObject: ExportedWKTType,
    textboxId?: string,
    labelText?: string,
    properties?: Record<string, any>,
    styleOptions?: StyleOptions,
    deleteOption?: Record<string, any>,
    selectOption?: Record<string, any>,
  ) {
    const { wkt, text } = wktObject;
    if (!wkt || !text) {
      return;
    }

    const tmpStringArray = wkt.split(' ');
    tmpStringArray.shift();
    let positionString = tmpStringArray.join(' ');
    positionString = positionString.replace('(', '');
    positionString = positionString.replace(')', '');
    positionString = positionString.trim();
    const [longitude, latitude] = positionString.split(' ');
    const cartoGraphicPosition = new Cartographic(
      parseFloat(longitude),
      parseFloat(latitude),
    );

    const height = this._scene.globe.getHeight(cartoGraphicPosition);
    const cartesianPosition = Cartesian3.fromDegrees(
      parseFloat(longitude),
      parseFloat(latitude),
      height,
    );

    const textbox = new Textbox({
      id: textboxId ? textboxId : createGuid(),
      name: `textbox ${this._textboxes.length + 1}`,
      show: true,
      scene: this._scene,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 1.0,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 0),
      }),
      labelCollection: this._labelCollection,
      position: cartesianPosition,
      properties: properties
        ? { ...this._properties, ...properties }
        : this._properties,
      locale: this._options.local,
      type: FeatureIdentity.TEXTBOX,
    });

    if (labelText) {
      textbox.setText(labelText);
    } else {
      textbox.setText(text);
    }

    if (deleteOption) {
      textbox.appendProperties(deleteOption);
    }
    if (selectOption) {
      textbox.appendProperties(selectOption);
    }

    if (styleOptions && styleOptions.textboxStyleOptions) {
      textbox.changeStyle(styleOptions);
    }

    this._textboxes.push(textbox);
    this.eventCreatedTextboxDraw.raiseEvent([textbox]);
    this._scene.camera.moveBackward(EPS);
    return textbox;
  }

  createTextbox(text: string) {
    const position = this._lastClickPosition.clone(new Cartesian3());
    const textbox = new Textbox({
      id: createGuid(),
      name: `textbox ${this._textboxes.length + 1}`,
      show: true,
      scene: this._scene,
      labelOptions: DrawingSettings.getLabelOptions({
        scale: 1.0,
        horizontalOrigin: HorizontalOrigin.CENTER,
        verticalOrigin: VerticalOrigin.CENTER,
        pixelOffset: new Cartesian2(0, 0),
      }),
      labelCollection: this._labelCollection,
      position: position,
      properties: this._properties,
      locale: this._options.local,
      type: FeatureIdentity.TEXTBOX,
    });
    textbox.setText(text);

    this._textboxes.push(textbox);
    this._eventCreatedTextboxDraw.raiseEvent([textbox]);

    if (this._isUseStyleOptions && this._styleOptions) {
      textbox.changeStyle(this._styleOptions);
    }

    if (this._deleteOption) {
      textbox.appendProperties(this._deleteOption);
    }

    if (this._selectOption) {
      textbox.appendProperties(this._selectOption);
    }

    this._textbox = textbox;
    return textbox;
  }

  deleteTextBox(id: string) {
    const selectedTextBox = this.getTextboxById(id);
    if (selectedTextBox) {
      const filteredTextboxes = this._textboxes.filter(
        (textbox) => textbox.id !== selectedTextBox.id,
      );
      this._textboxes = filteredTextboxes;
      const selectedTextBoxId = selectedTextBox.id;
      selectedTextBox.destroy();
      this._eventDeletedTextboxDraw.raiseEvent([selectedTextBoxId]);
    }
  }

  deleteAllTextBox() {
    for (let i = 0; i < this._textboxes.length; i++) {
      this._textboxes[i].destroy();
    }
    clearArray(this._textboxes);
    this._eventDeletedAllTextboxDraw.raiseEvent();
  }

  enableEdit() {
    this._mode = DrawingMode.EditDraw;
  }

  disableEdit() {
    this._mode = DrawingMode.None;
    this._editableTextboxId = undefined;
  }

  getTextboxById(id: string) {
    const filteredTextbox = this._textboxes.find(
      (textbox) => textbox.id === id,
    );
    if (!filteredTextbox) {
      return;
    }

    return filteredTextbox;
  }

  changeStyleById(id: string, styleOptions: StyleOptions) {
    if (!id) {
      return;
    }

    const selectedTextBox = this.getTextboxById(id);
    if (!selectedTextBox) {
      return;
    }

    selectedTextBox.changeStyle(styleOptions);
  }

  changeStyle(styleOptions: StyleOptions) {
    if (!this._editableTextboxId || this._mode !== DrawingMode.EditDraw) {
      return;
    }

    this.changeStyleById(this._editableTextboxId, styleOptions);
  }

  resetStyleById(id: string) {
    for (let i = 0; i < this._textboxes.length; i++) {
      if (this._textboxes[i].id === id) {
        this._textboxes[i].resetStyle();
      }
    }
  }

  resetStyle() {
    for (let i = 0; i < this._textboxes.length; i++) {
      this._textboxes[i].resetStyle();
    }
  }

  resetDrawingStyle() {
    this._styleOptions = this._defaultStyle;
  }

  destroy() {
    return destroyObject(this);
  }
}
