import { IconIdentifier } from '@aus-platform/design-system';
import { isNull, reduce } from 'lodash';
import {
  SpacerPlacement,
  WorkspaceToolbarItem,
  WorkspaceToolbarTool,
} from '../workspace-toolbar/types';
import { SelectOperation } from './enums';
import { GenerateToolBarItemsOptions } from './types';

/**
 * The function `applySelectOperation` takes an operation type and a list of boolean values, then
 * performs the specified select operation on each value in the list.
 * @param {SelectOperation} operationType - The `operationType` parameter is a type of operation to be
 * applied to the `inputListObj`.
 * @param inputListObj - The `inputListObj` parameter is a JavaScript object where the keys are strings
 * and the values are booleans. It represents a list of items with each item being associated with a
 * boolean value indicating whether it is selected or not.
 * @returns the result of the operation.
 */
export const applySelectOperation = (
  operationType: SelectOperation,
  inputListObj: Record<string, boolean | null>,
) => {
  return reduce(
    inputListObj,
    (accumulator, value, key) => {
      switch (operationType) {
        case SelectOperation.SelectAll: {
          if (!isNull(value)) {
            accumulator[key] = true;
          }
          return accumulator;
        }
        case SelectOperation.DeselectAll: {
          if (!isNull(value)) {
            accumulator[key] = false;
          }
          return accumulator;
        }
        case SelectOperation.SelectInverse: {
          if (!isNull(value)) {
            accumulator[key] = !value;
          }
          return accumulator;
        }
      }
    },
    {},
  );
};

/**
 * The function `generateToolbarItems` creates an array of toolbar items with specific tools, icons,
 * click handlers, tooltips, and disabled states based on the provided options.
 * @param {Record<string, boolean>} selectedActiveLayers - It is a record that maps string keys to boolean values. It is used
 * to keep track of which layers are currently selected or active.
 * @param {number} selectedLayersCount - The number of selected active layers.
 * @param setSelectedActiveLayers - to update the state of the `selectedActiveLayers` object
 * @param {DeleteToolOptions} deleteToolOptions - Options passed to the delete tool specification.
 */
export const generateToolbarItems = ({
  selectedActiveLayers,
  selectedLayersCount,
  setSelectedActiveLayers,
  deleteToolOptions,
}: GenerateToolBarItemsOptions): WorkspaceToolbarItem[] => [
  {
    tool: WorkspaceToolbarTool.SelectAll,
    icon: IconIdentifier.Select,
    onClickHandler: () => {
      setSelectedActiveLayers(
        applySelectOperation(SelectOperation.SelectAll, selectedActiveLayers),
      );
    },
    toolTipText: 'Select all',
  },
  {
    tool: WorkspaceToolbarTool.DeselectAll,
    icon: IconIdentifier.Deselect,
    onClickHandler: () => {
      setSelectedActiveLayers(
        applySelectOperation(SelectOperation.DeselectAll, selectedActiveLayers),
      );
    },
    toolTipText: 'Deselect all',
    disabled: selectedLayersCount < 1,
  },
  {
    tool: WorkspaceToolbarTool.SelectInvert,
    icon: IconIdentifier.SelectInvert,
    onClickHandler: () => {
      setSelectedActiveLayers(
        applySelectOperation(
          SelectOperation.SelectInverse,
          selectedActiveLayers,
        ),
      );
    },
    toolTipText: 'Select inverse',
    spacer: SpacerPlacement.Right,
    disabled: selectedLayersCount < 1,
  },
  {
    tool: WorkspaceToolbarTool.Delete,
    icon: IconIdentifier.Bin,
    onClickHandler: deleteToolOptions.onBulkDeleteHandler,
    toolTipText:
      deleteToolOptions.isAnyLayerEditable && selectedLayersCount > 0
        ? 'One of the selected layers is in the editing mode. Save or cancel your edits to enable this option'
        : 'Remove selected layers from workspace',
    disabled: selectedLayersCount < 1 || deleteToolOptions.isAnyLayerEditable,
  },
];
