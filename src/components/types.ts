import { CesiumViewer } from '@aus-platform/cesium';

export type GUIProps = {
  viewer: CesiumViewer;
};

export type ShortcutUIProps = {
  viewer: CesiumViewer;
};

export enum ShortCutFunction {
  PANNING = 'PA',
  HROTATION = 'HR',
  VROTATION = 'VR',
  ZOOM = 'ZO'
}
