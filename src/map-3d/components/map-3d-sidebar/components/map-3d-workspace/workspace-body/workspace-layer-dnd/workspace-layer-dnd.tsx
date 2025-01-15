import { isNil } from 'lodash';
import { useCallback, useState } from 'react';
import {
  DragDropContext,
  Droppable,
  DroppableStateSnapshot,
} from 'react-beautiful-dnd';
import { reorderMapLayers, updateWorkspaceLayerZIndices } from '../../shared';
import {
  calculatePlaceholderClientY,
  getDraggedDom,
  reorderList,
} from './helpers';
import { useAppDispatch, useAppSelector } from 'app/hooks';
import {
  selectMap3DState,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { WorkspaceLayer } from 'map-3d/components/map-3d-sidebar/shared';

type PlaceholderType = {
  clientWidth: number;
  clientY: number;
};

/**
 * When item is scrolled to the bottom, there exists a flickering issue
 * in the library which hasn't been solved.
 * https://github.com/petyosi/react-virtuoso/issues/426
 * Also, to support auto-scroll, we cannot suppress the warning from
 * react-beautiful-dnd in development
 * https://github.com/atlassian/react-beautiful-dnd/issues/131
 */
export const WorkspaceLayerDnd = ({
  activeLayerList,
  setActiveLayerList,
  children,
}) => {
  // Selectors.
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // Dispatcher.
  const dispatch = useAppDispatch();

  // States.
  const [placeholderProps, setPlaceholderProps] = useState<PlaceholderType>();

  // Handlers.
  const updateLayer = (layer) => {
    dispatch(updateWorkspaceLayer(layer));
  };

  // Handle displaying the line where the original element was.
  const onDragStart = (event) => {
    // Add vibration if browser supports it. (gives a haptic feedback)
    if (window.navigator.vibrate) {
      window.navigator.vibrate(100);
    }

    const draggedDOM = getDraggedDom(event.draggableId);

    if (isNil(draggedDOM) || isNil(draggedDOM?.parentNode)) {
      return;
    }

    const { clientWidth } = draggedDOM;
    const sourceIndex = event.source.index;
    const clientY = calculatePlaceholderClientY(
      [...draggedDOM.parentNode.children],
      sourceIndex,
    );

    setPlaceholderProps({
      clientWidth,
      clientY,
    });
  };

  //  Handle displaying placeholder when dragging over elements.
  const onDragUpdate = (event) => {
    if (!event.destination) {
      return;
    }

    const draggedDOM = getDraggedDom(event.draggableId);

    if (!draggedDOM || !draggedDOM.parentNode) {
      return;
    }

    const { clientWidth } = draggedDOM;
    const destinationIndex = event.destination.index;
    const sourceIndex = event.source.index;

    const childrenArray = [...draggedDOM.parentNode.children];
    const movedItem = childrenArray[sourceIndex];

    childrenArray.splice(sourceIndex, 1);
    const updatedArray = [
      ...childrenArray.slice(0, destinationIndex),
      movedItem,
      ...childrenArray.slice(destinationIndex + 1),
    ];

    const clientY = calculatePlaceholderClientY(updatedArray, destinationIndex);

    setPlaceholderProps({
      clientWidth,
      clientY,
    });
  };

  // Update state of sortedLayerList & map layers on dragend.
  const onDragEnd = useCallback(
    (result) => {
      setPlaceholderProps(undefined);

      if (!result.destination || isNil(activeLayerList)) {
        return;
      }

      const sourceIndex = result.source.index,
        destinationIndex = result.destination.index;

      if (sourceIndex === destinationIndex) {
        return;
      }

      reorderMapLayers(
        cesiumProxy,
        activeLayerList,
        sourceIndex,
        destinationIndex,
      );

      const reorderedLayers: WorkspaceLayer[] = reorderList(
        activeLayerList,
        sourceIndex,
        destinationIndex,
      );
      setActiveLayerList(reorderedLayers);

      /**
       * Optimistically updated the UI
       * b/c if the onDragEnd callback takes more time to execute,
       * the element being dragged goes back to sourceIndex leading to a glitch.
       */
      setTimeout(() => {
        if (cesiumProxy) {
          updateWorkspaceLayerZIndices(
            cesiumProxy,
            activeLayerList,
            updateLayer,
          );
        }
      }, 0);
    },
    [activeLayerList, cesiumProxy],
  );

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      onDragUpdate={onDragUpdate}
    >
      <Droppable droppableId="workspace-dnd">
        {(provided, dropSnapshot: DroppableStateSnapshot) => {
          const isPlaceholderVisible =
            dropSnapshot.isDraggingOver &&
            provided.placeholder &&
            !isNil(placeholderProps);

          return (
            <div
              ref={provided.innerRef}
              className="workspace-dnd"
              {...provided.droppableProps}
            >
              <div
                className="workspace-dnd__scroll-container"
                data-testid="workspace-dnd-layers-container"
              >
                {children}
              </div>
              {/* This is a placeholder that will be used to
        show the space where the item will be dropped */}
              {isPlaceholderVisible && (
                <div
                  className="workspace-dnd__placeholder"
                  style={{
                    top: placeholderProps.clientY,
                    width: placeholderProps.clientWidth,
                  }}
                />
              )}

              <div className="workspace-dnd__native-placeholder">
                {provided.placeholder}
              </div>
            </div>
          );
        }}
      </Droppable>
    </DragDropContext>
  );
};
