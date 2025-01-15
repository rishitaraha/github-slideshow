import {
  ColorClass,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  MeatBallsMenu,
  MeatBallsMenuDirection,
} from '@aus-platform/design-system';
import { filter } from 'lodash';
import { useRef } from 'react';
import {
  removeWorkspaceLayersFromMap,
  updateWorkspaceLayerZIndices,
} from 'map-3d/components/map-3d-sidebar/components/map-3d-workspace/shared';
import {
  WorkspaceLayer,
  WorkspaceLayerListObj,
} from 'map-3d/components/map-3d-sidebar/shared';
import {
  removeWorkspaceLayers,
  selectMap3DState,
  selectMap3dWorkspace,
  setCurrentEditableLayerId,
  setShowUnsavedFeaturesModal,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { LayerType } from 'shared/api';
import { useAppDispatch, useAppSelector } from 'app/hooks';

type LayerMeatBallMenuProps = {
  layer: WorkspaceLayer;
  showFeatureCount: boolean;
  setShowFeatureCount: React.Dispatch<React.SetStateAction<boolean>>;
  setShowSelectAreaCategoryModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export const LayerMeatBallMenu: React.FC<LayerMeatBallMenuProps> = ({
  layer,
  showFeatureCount,
  setShowFeatureCount,
  setShowSelectAreaCategoryModal,
}) => {
  // Refs.
  const checkboxRef = useRef<HTMLInputElement>(null);

  // Dispatch.
  const dispatch = useAppDispatch();

  // Selectors.
  const { currentEditableLayerId, drawingTools, actionTools, workspaceLayers } =
    useAppSelector(selectMap3dWorkspace);

  const { cesiumProxy } = useAppSelector(selectMap3DState);

  // Constants.
  const isVisible = layer.show;

  // Handlers.
  const goToLayer = () => {
    const newTab = window.open(
      `/layers?iterationId=${layer.iteration?.id}&highlightLayer=${layer.id}`,
      '_blank',
    );
    newTab?.focus();
  };

  const setLayer = (layer: WorkspaceLayerListObj) => {
    dispatch(updateWorkspaceLayer(layer));
  };

  const onClickRemoveFromWorkspace = (id: string, layer: WorkspaceLayer) => {
    // If Toggled layer is the currently active editable layer.
    if (id === currentEditableLayerId) {
      if (drawingTools?.checkUnsavedFeatures()) {
        dispatch(setShowUnsavedFeaturesModal(true));
        return;
      }
      dispatch(setCurrentEditableLayerId(null));

      // Clear current state of all tools.
      drawingTools?.resetAllDrawnFeatureArrays();

      // Deactivate all tools.
      drawingTools?.deactivateAllTools();
      actionTools?.deactivateAllTools();
    }

    removeWorkspaceLayersFromMap([layer], drawingTools, cesiumProxy);
    dispatch(removeWorkspaceLayers([layer.id]));

    // Filtering out the current layer (b/c we won't have the updated "workspaceLayers" redux state)
    const activeLayers = filter(workspaceLayers, (currentLayer) => {
      return currentLayer.id !== id;
    });

    if (cesiumProxy) {
      updateWorkspaceLayerZIndices(cesiumProxy, activeLayers, setLayer);
    }
  };

  const onClickSelectAreaCategory = () => {
    setShowSelectAreaCategoryModal(true);
  };

  return (
    <MeatBallsMenu
      className="layer-meatball-menu"
      drop={MeatBallsMenuDirection.Down}
      onClick={(event) => {
        event.stopPropagation();
      }}
      data-testid="meatball-menu-button"
    >
      <MeatBallsMenu.Item
        onClick={() => onClickRemoveFromWorkspace(layer.id, layer)}
        disabled={layer.id === currentEditableLayerId}
        data-testid="remove-from-workspace-action"
      >
        Remove from workspace
      </MeatBallsMenu.Item>
      {layer.type === LayerType.Vector && isVisible && (
        <MeatBallsMenu.Item>
          <InputGroup
            onClick={(event) => {
              event.stopPropagation();
              checkboxRef.current?.click();
            }}
          >
            <Input.Label>Show Feature Count</Input.Label>
            <Input.CheckBox
              checked={showFeatureCount}
              ref={checkboxRef}
              onClick={(event) => {
                event.stopPropagation();
                setShowFeatureCount(!showFeatureCount);
              }}
            />
          </InputGroup>
        </MeatBallsMenu.Item>
      )}
      {layer.type === LayerType.Vector && layer.canManageLayer && isVisible && (
        <MeatBallsMenu.Item
          onClick={onClickSelectAreaCategory}
          data-testid="select-area-category-action"
        >
          Select an Area Category
        </MeatBallsMenu.Item>
      )}
      {layer.type !== LayerType.CapturedDsm && (
        <MeatBallsMenu.Item
          onClick={goToLayer}
          className="layer-meatball-menu__go-to-layer"
          data-testid="goto-layer-page-action"
        >
          Go to Layer Page
          <Icon
            colorClass={ColorClass.Neutral200}
            identifier={IconIdentifier.ArrowUpRight}
            size={18}
          />
        </MeatBallsMenu.Item>
      )}
    </MeatBallsMenu>
  );
};
