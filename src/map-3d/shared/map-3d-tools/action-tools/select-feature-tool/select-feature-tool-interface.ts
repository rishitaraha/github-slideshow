import {
  SelectFeatureTool as CesiumSelectFeatureTool,
  Line,
  Point,
  Polygon,
  Textbox,
} from '@aus-platform/cesium';
import { SelectToolEventType } from './enums';
import { SelectToolEventListener } from './types';

export interface ISelectFeatureTool {
  deleteSelectedFeatures: VoidFunction;
  activate(
    selectOptions: Record<string, any>,
    enableSelectFeatureListener?: boolean,
  ): void;
  deactivate: VoidFunction;
  resetSelectedFeatures: VoidFunction;
  deselectSelectedFeatures: VoidFunction;
  destroy: VoidFunction;

  // Listeners.
  activateDefaultListeners: () => void;
  removeDefaultListeners: VoidFunction;
  addEventListener(
    type: SelectToolEventType,
    listener: SelectToolEventListener,
  ): void;
  removeEventListener(
    type: SelectToolEventType,
    listener: SelectToolEventListener,
  ): void;

  // Getter.
  selectFeatureTool: CesiumSelectFeatureTool;
  selectedFeatureCount: number;
  selectedFeatures: (Line | Polygon | Point | Textbox)[];
}
