import classNames from 'classnames';
import {
  countBy,
  find,
  includes,
  isEmpty,
  isNil,
  isNull,
  isUndefined,
  keys,
  omitBy,
  partition,
  pickBy,
} from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import {
  Draggable,
  DraggableProvided,
  DraggableStateSnapshot,
} from 'react-beautiful-dnd';
import {
  removeWorkspaceLayersFromMap,
  sortLayers,
  updateWorkspaceLayerZIndices,
} from '../../shared';
import { WorkSpaceActiveLayer } from '../workspace-active-layer';
import { WorkspaceLayerDnd } from '../workspace-layer-dnd';
import { WorkspaceToolbar } from '../workspace-toolbar';
import { generateToolbarItems } from './helpers';
import { useShiftSelect } from 'src/shared/hooks';
import {
  removeWorkspaceLayers,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import {
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from 'map-3d/components/map-3d-sidebar/shared';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const WorkspaceLayersContainer: React.FC = () => {
  // Selectors
  const { selectedProject } = useAppSelector(selectMap3dDataset);
  const { workspaceLayers, currentEditableLayerId, drawingTools } =
    useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // States.
  const [activeLayerList, setActiveLayerList] = useState<WorkspaceLayer[]>([]);
  const [selectedActiveLayers, setSelectedActiveLayers] = useState<
    Record<string, boolean | null>
  >({});

  const onShiftSelectionEndHandler = (
    layersToSelect: WorkspaceLayer[],
    layersToDeselect: WorkspaceLayer[],
  ) => {
    const selectedActiveLayersCopy = { ...selectedActiveLayers };

    if (layersToSelect.length > 1 || layersToDeselect.length > 0) {
      // Handle selection for shift selection.
      layersToDeselect.forEach((layer) => {
        selectedActiveLayersCopy[layer.id] = false;
      });
      layersToSelect.forEach((layer) => {
        selectedActiveLayersCopy[layer.id] = true;
      });
    } else {
      // Handle selection for single click.
      layersToSelect.forEach((layer) => {
        selectedActiveLayersCopy[layer.id] =
          !selectedActiveLayersCopy[layer.id];
      });
    }

    setSelectedActiveLayers(selectedActiveLayersCopy);
  };

  // Hooks.
  const { selectionHandler } = useShiftSelect<WorkspaceLayer>(
    activeLayerList,
    onShiftSelectionEndHandler,
  );

  // Dispatch.
  const dispatch = useAppDispatch();

  // Constants.
  const isDnDDisabled = !isNil(currentEditableLayerId);

  const selectedLayersCount = useMemo(() => {
    const count = countBy(selectedActiveLayers)['true'];
    return isUndefined(count) ? 0 : count;
  }, [selectedActiveLayers]);

  // useEffects.
  useEffect(() => {
    const sortedLayers = sortLayers(Object.values(workspaceLayers));
    setActiveLayerList(sortedLayers);
  }, [workspaceLayers]);

  useEffect(() => {
    if (!isNil(activeLayerList)) {
      const initialReducerValue = omitBy(selectedActiveLayers, (_, layerId) => {
        return isNil(find(activeLayerList, { id: layerId }));
      });

      const selectedLayers = activeLayerList.reduce(
        (prev: Record<string, boolean | null>, layer: WorkspaceLayer) => {
          if (isNil(prev[layer.id])) {
            prev[layer.id] = false;
          }
          return prev;
        },
        initialReducerValue,
      );

      setSelectedActiveLayers(selectedLayers);
    }
  }, [activeLayerList]);

  // Handlers.
  const onSelectWorkspaceLayer = (
    event: React.MouseEvent<HTMLInputElement>,
    index: number,
  ) => {
    selectionHandler(event, index);
  };

  const bulkRemoveLayersFromWorkspace = () => {
    const selectedActiveLayersIds = keys(pickBy(selectedActiveLayers, Boolean));
    const [layers, workspaceLayerListAfterRemovingLayers] = partition(
      workspaceLayers,
      (layer) => includes(selectedActiveLayersIds, layer.id),
    );

    removeWorkspaceLayersFromMap(layers, drawingTools, cesiumProxy);

    dispatch(removeWorkspaceLayers(selectedActiveLayersIds));

    if (cesiumProxy) {
      // Update z-index of layers present in redux by fetching latest z-index from Cesium.
      updateWorkspaceLayerZIndices(
        cesiumProxy,
        workspaceLayerListAfterRemovingLayers,
        updateLayer,
      );
    }

    // Reset the selectedActiveLayers for the selectedActiveLayerIds.
    setSelectedActiveLayers((prev) => {
      selectedActiveLayersIds.forEach((id) => {
        prev[id] = null;
      });
      return { ...prev };
    });
  };

  // Helpers.
  const updateLayer = (layer: WorkspaceLayerListObj) => {
    dispatch(updateWorkspaceLayer(layer));
  };

  // Renders.
  if (isNil(selectedProject)) {
    return (
      <div className="workspace-empty-list">
        Select a Project from above dropdown
      </div>
    );
  } else if (isEmpty(workspaceLayers)) {
    return (
      <div className="workspace-empty-list">
        No layers added for visualisation
      </div>
    );
  } else {
    return (
      <>
        <WorkspaceToolbar
          toolbarItems={generateToolbarItems({
            selectedActiveLayers,
            selectedLayersCount,
            setSelectedActiveLayers,
            deleteToolOptions: {
              onBulkDeleteHandler: bulkRemoveLayersFromWorkspace,
              isAnyLayerEditable: !isNull(currentEditableLayerId),
            },
          })}
          selectedItemsCount={selectedLayersCount}
        />
        <WorkspaceLayerDnd
          activeLayerList={activeLayerList}
          setActiveLayerList={setActiveLayerList}
        >
          {activeLayerList?.map((layer, index) => {
            const { id } = layer;

            return (
              <Draggable
                key={id}
                index={index}
                draggableId={id}
                isDragDisabled={isDnDDisabled}
              >
                {(
                  provided: DraggableProvided,
                  dragSnapshot: DraggableStateSnapshot,
                ) => {
                  const activeLayerClassname = classNames(
                    'workspace-active-layer',
                    {
                      'workspace-active-layer--is-dragging':
                        dragSnapshot.isDragging,
                    },
                  );
                  return (
                    <div
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      ref={provided.innerRef}
                      className="workspace-active-layer-draggable"
                    >
                      <WorkSpaceActiveLayer
                        key={id}
                        className={activeLayerClassname}
                        layer={layer}
                        isChecked={!!selectedActiveLayers[id]}
                        onClick={onSelectWorkspaceLayer}
                        index={index}
                      />
                    </div>
                  );
                }}
              </Draggable>
            );
          })}
        </WorkspaceLayerDnd>
      </>
    );
  }
};
