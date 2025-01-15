import { Icon, IconIdentifier } from '@aus-platform/design-system';
import classNames from 'classnames';
import { zoomToLayer } from '../../../../shared';
import { LayerAction, LayerActionItemProps } from './types';
import {
  WorkspaceRightSideCard,
  exitEditableLayer,
  resetPropertiesLayer,
  selectMap3DState,
  selectMap3dDataset,
  selectMap3dWorkspace,
  setCurrentEditableLayerId,
  setCurrentPropertyLayerId,
  setRightSideCard,
  setShowUnsavedFeaturesModal,
  updateWorkspaceLayer,
} from 'map-3d/shared/map-3d-slices';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const LayerActionItem: React.FC<LayerActionItemProps> = ({
  layer,
  refetchFeatures,
}) => {
  // Dispatch.
  const dispatch = useAppDispatch();

  // Selectors.
  const { activeWorkspaceSite } = useAppSelector(selectMap3dDataset);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { drawingTools } = useAppSelector(selectMap3dWorkspace);

  // Constants.
  const isLayerVisible = layer.show;
  const layerItemContainerClassName = classNames([
    'layer-action-item-container',
    { 'layer-action-item-container--show': !isLayerVisible },
  ]);

  // Handlers.
  const onClick = (
    event: React.MouseEvent<SVGElement>,
    actionType: LayerAction,
  ) => {
    event.stopPropagation();
    switch (actionType) {
      case LayerAction.Zoom: {
        onClickZoomToLayer();
        break;
      }
      case LayerAction.Edit: {
        onClickEditLayer();
        break;
      }
      case LayerAction.ToggleVisibility: {
        onClickVisibility();
        break;
      }
      case LayerAction.Info: {
        onClickInfo();
        break;
      }
    }
  };

  const onClickEditLayer = () => {
    if (drawingTools?.checkUnsavedFeatures()) {
      dispatch(setShowUnsavedFeaturesModal(true));
    } else {
      // When switching to edit another layer, first exit previous editable layer.
      dispatch(exitEditableLayer({ refreshRequired: true }));

      refetchFeatures();

      // Close layer info SC when we go to editing mode.
      dispatch(resetPropertiesLayer());
      dispatch(setCurrentEditableLayerId(layer.id));
      dispatch(setRightSideCard(WorkspaceRightSideCard.FeatureStyling));
    }
  };

  const onClickVisibility = () => {
    if (layer.mapLayer) {
      layer.mapLayer.show = !isLayerVisible;
    }

    const updatedLayer = {
      [layer.id]: {
        ...layer,
        show: !isLayerVisible,
      },
    };

    dispatch(updateWorkspaceLayer(updatedLayer));
  };

  const onClickZoomToLayer = () => {
    zoomToLayer(layer, cesiumProxy, activeWorkspaceSite);
  };

  const onClickInfo = () => {
    dispatch(setCurrentPropertyLayerId(layer.id));
    dispatch(setRightSideCard(WorkspaceRightSideCard.LayerProperties));
  };

  return (
    <div className={layerItemContainerClassName}>
      {layer.mapLayer && (
        <div className="layer-action-item">
          <Icon
            identifier={IconIdentifier.GCPAvailableTagged}
            onClick={(event: React.MouseEvent<SVGElement>) =>
              onClick(event, LayerAction.Zoom)
            }
            size={16}
            isDisabled={!isLayerVisible}
          />
        </div>
      )}
      {layer.canManageLayer && layer.canEditFeatures && (
        <div className="layer-action-item">
          <Icon
            identifier={IconIdentifier.PencilFill}
            size={16}
            onClick={(event: React.MouseEvent<SVGElement>) =>
              onClick(event, LayerAction.Edit)
            }
            isDisabled={!isLayerVisible}
          />
        </div>
      )}
      <div className="layer-action-item">
        <Icon
          identifier={
            isLayerVisible
              ? IconIdentifier.VisibilityOn
              : IconIdentifier.VisibilityOff
          }
          size={16}
          onClick={(event: React.MouseEvent<SVGElement>) =>
            onClick(event, LayerAction.ToggleVisibility)
          }
        />
      </div>
      <div className="layer-action-item">
        <Icon
          identifier={IconIdentifier.InfoCircle}
          size={16}
          onClick={(event: React.MouseEvent<SVGElement>) =>
            onClick(event, LayerAction.Info)
          }
          isDisabled={!isLayerVisible}
        />
      </div>
    </div>
  );
};
