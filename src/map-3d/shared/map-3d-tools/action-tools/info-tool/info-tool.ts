import { CesiumViewer, CesiumViewerType } from '@aus-platform/cesium';
import { Event, ScreenSpaceEventType } from 'cesium';
import { getCartographicPositionFromMousePosition } from '../../../../../shared/cesium';
import { BaseTool } from '../../base-tool';
import { IInfoTool } from './info-tool-interface';
import { InfoToolEvent, PointInfo } from './types';

export class InfoTool extends BaseTool implements IInfoTool {
  // Events.
  private readonly _eventOnLeftClick: Event;

  // Properties.
  private _info: PointInfo = {};

  constructor(viewer: CesiumViewer) {
    super(viewer);
    this._eventOnLeftClick = new Event();
  }

  activate(): void {
    this._setDefaultInputActions();
    this.viewer.canvas.style.cursor = 'crosshair';
  }

  deactivate(): void {
    this._removeDefaultInputActions();
    this.viewer.canvas.style.cursor = 'default';
  }

  addEventListener(type: InfoToolEvent, listener: any) {
    switch (type) {
      case InfoToolEvent.LeftClick:
        this._eventOnLeftClick.addEventListener(listener);
        break;

      default:
        break;
    }
  }

  removeEventListener(type: InfoToolEvent, listener: any) {
    switch (type) {
      case InfoToolEvent.LeftClick:
        this._eventOnLeftClick.removeEventListener(listener);
        break;

      default:
        break;
    }
  }

  // Private Methods.
  _setDefaultInputActions() {
    this.screenSpaceEventHandler.setInputAction(
      (click) => this._calculatePointInfoAction(click, this.viewer),
      ScreenSpaceEventType.LEFT_CLICK,
    );
  }

  _removeDefaultInputActions() {
    this.screenSpaceEventHandler.removeInputAction(
      ScreenSpaceEventType.LEFT_CLICK,
    );
  }

  _calculatePointInfoAction(click: any, viewer: CesiumViewerType) {
    const position = getCartographicPositionFromMousePosition(
      click.position,
      viewer,
    );
    if (position) {
      this._info.longitude = position.longitude;
      this._info.latitude = position.latitude;

      if (position.altitude !== 0) {
        this._info.altitude = position.altitude;
      }

      this._eventOnLeftClick.raiseEvent([
        position.latitude,
        position.longitude,
        position.altitude,
      ]);
    }
  }

  // Getters.
  get latitude(): number | undefined {
    return this._info.latitude;
  }
  get longitude(): number | undefined {
    return this._info.longitude;
  }
  get altitude(): number | undefined {
    return this._info.altitude;
  }
  get info(): PointInfo {
    return this._info;
  }

  // Setters.
  set altitude(altitude: number) {
    this._info.altitude = altitude;
  }

  // Cleanup.
  destroy() {
    this.deactivate();
    this._info = {};
  }
}
