import { InfoToolEvent, PointInfo } from './types';

export interface IInfoTool {
  // Methods.
  activate: VoidFunction;
  deactivate: VoidFunction;
  destroy: VoidFunction;

  // Event methods.
  addEventListener: (type: InfoToolEvent, listener: any) => void;
  removeEventListener: (type: InfoToolEvent, listener: any) => void;

  // Getters.
  latitude: number | undefined;
  longitude: number | undefined;
  altitude: number | undefined;
  info: PointInfo;
}
