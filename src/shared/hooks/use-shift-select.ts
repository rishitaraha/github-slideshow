import { isNull } from 'lodash';
import { useState } from 'react';

type SelectionRange = {
  start: number;
  end: number;
};

/**
 * Custom hook to handle shift key selection logic.
 * @param list - The list of items to select from.
 * @param onShiftSelectEnd - Callback function when items are selected with the shift key.
 * @returns - An object containing the selection handler.
 */
export const useShiftSelect = <T>(
  list: Array<T>,
  onShiftSelectEnd: (
    itemsToSelect: Array<T>,
    itemsToDeselect: Array<T>,
  ) => void,
) => {
  // States.
  const [previousStartIndex, setPreviousStartIndex] = useState<number>(-1);
  const [previousEndIndex, setPreviousEndIndex] = useState<number>(-1);
  const [isReverseSelection, setIsReverseSelection] = useState<boolean>(false);

  // Handler.
  const selectionHandler = (
    event: React.MouseEvent<HTMLInputElement>,
    index: number,
  ) => {
    let start = index;
    let end = index;
    let reverse = isReverseSelection;

    let deselectionRange: SelectionRange | null = null;

    const { shiftKey } = event;

    if (shiftKey && previousStartIndex !== index) {
      if (index < previousStartIndex && index < previousEndIndex) {
        // Reverse selection direction - Bottom to top.
        reverse = true;

        /**
         * Let's say we have selected indices 2 and 5. Then we shift click on index 0, then we'll need to deselect 3-5 and select 0-2
         * To store these 3-5 indices we are creating this deselectionRange variable
         */
        deselectionRange = { start: previousStartIndex, end: previousEndIndex };
      } else if (index > previousStartIndex && index > previousEndIndex) {
        // Top to bottom selection direction.
        reverse = false;

        /**
         * Let's say we have selected indices 5 and 2. Then we shift click on index 6, then we'll need to deselect 5-2 and select 5-6
         * To store these 5-2 indices we are creating this deselectionRange variable
         */
        deselectionRange = { start: previousEndIndex, end: previousStartIndex };
      } else {
        deselectionRange = null;
      }

      // Define the range of selection.
      start = reverse
        ? Math.max(index, previousStartIndex)
        : Math.min(index, previousStartIndex);

      end = reverse
        ? Math.min(index, previousStartIndex)
        : Math.max(index, previousStartIndex);
    } else {
      start = index;
      end = index;
      deselectionRange = null;
    }

    const itemsToSelect = list.slice(
      Math.min(start, end),
      Math.max(start, end) + 1,
    );

    let itemsToDeselect: Array<T> = [];

    if (!isNull(deselectionRange)) {
      itemsToDeselect = list.slice(
        deselectionRange.start,
        deselectionRange.end + 1,
      );
    } else if (previousStartIndex !== previousEndIndex) {
      itemsToDeselect = list.slice(
        Math.min(previousStartIndex, previousEndIndex),
        Math.max(previousStartIndex, previousEndIndex) + 1,
      );
    }

    onShiftSelectEnd(itemsToSelect, itemsToDeselect);

    setPreviousStartIndex(start);
    setPreviousEndIndex(end);
    setIsReverseSelection(reverse);
  };

  return {
    selectionHandler,
  };
};
