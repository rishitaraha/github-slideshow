export const getDraggedDom = (draggableId) => {
  const queryAttr = 'data-rbd-drag-handle-draggable-id';
  const domQuery = `[${queryAttr}='${draggableId}']`;
  const draggedDOM = document.querySelector(domQuery);

  return draggedDOM;
};

/**
 * Calculates the position of the placeholder.
 * @param array - Array of DOM elements of items we're dragging
 * @param destinationIndex - Index of array element after which placeholder should be displayed.
 * @returns Top position of the placeholder.
 */
export const calculatePlaceholderClientY = (
  array: Array<Element>,
  destinationIndex: number,
) => {
  // marginBottom - margin b/w 2 elems in list
  // listStartPosition - top position from where the dnd list starts.
  const marginBottom = 4,
    listStartPosition = 8;

  const clientY = array.slice(0, destinationIndex).reduce((sum, current) => {
    return sum + current.clientHeight + marginBottom;
  }, 0);

  return clientY + listStartPosition;
};

export const reorderList = <T>(
  list: T[],
  startIndex: number,
  endIndex: number,
): T[] => {
  if (startIndex > list.length || endIndex > list.length) {
    return list;
  }

  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
};
