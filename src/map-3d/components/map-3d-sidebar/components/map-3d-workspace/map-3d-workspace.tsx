import { SideBarCard } from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Map3DSideBarContext } from '../../../../contexts';
import {
  WorkspaceRightSideCard,
  resetPropertiesLayer,
  selectMap3DState,
  selectMap3dSidebar,
  selectMap3dWorkspace,
  setActionTools,
  setCurrentEditableLayerId,
  setDrawingTools,
  setRightSideCard,
} from '../../../../shared/map-3d-slices';
import { ActionTools, DrawingTools } from '../../../../shared/map-3d-tools';
import {
  SelectTerrainFooter,
  SelectTerrainModal,
} from '../../shared/components';
import { CreateLayerModal } from './modals';
import {
  LayerPropertiesSidecard,
  LayerStylingSidecard,
  SelectDatasetSidecard,
} from './sidecards';
import { WorkSpaceBody } from './workspace-body';
import { WorkSpaceToolbox } from './workspace-toolbox';
import { useAppDispatch, useAppSelector } from 'app/hooks';

export const Map3DWorkspace: React.FC = () => {
  // States.
  const [showModals, setShowModals] = useState({
    createLayerModal: false,
    selectTerrainModal: false,
  });

  // Selectors.
  const {
    currentEditableLayerId,
    rightSideCard,
    drawingTools,
    actionTools,
    currentPropertyLayerId,
  } = useAppSelector(selectMap3dWorkspace);
  const { cesiumProxy } = useAppSelector(selectMap3DState);
  const { activeSidebarOption } = useAppSelector(selectMap3dSidebar);

  // Dispatch.
  const dispatch = useAppDispatch();

  // Contexts.
  const { hideSidecard: onCloseSidebarCard } = useContext(Map3DSideBarContext);

  // Constants.
  const showLayerPropertiesSidecard =
    !isNil(currentPropertyLayerId) &&
    rightSideCard == WorkspaceRightSideCard.LayerProperties;

  const showLayerStyleSidecard =
    rightSideCard === WorkspaceRightSideCard.FeatureStyling &&
    !isNil(currentEditableLayerId);

  // useEffect - Mount.
  useEffect(() => {
    if (cesiumProxy) {
      dispatch(setDrawingTools(new DrawingTools(cesiumProxy.cesiumViewer)));
      dispatch(setActionTools(new ActionTools(cesiumProxy.cesiumViewer)));
    }

    return () => {
      drawingTools?.deactivateAllTools();
      actionTools?.deactivateAllTools();
      dispatch(setCurrentEditableLayerId(null));
      dispatch(setActionTools(null));
      onCloseSidecard();
    };
  }, []);

  // Sidecard Handlers.
  const onCloseSidecard = () => {
    dispatch(setRightSideCard(WorkspaceRightSideCard.None));
  };

  const onCloseLayerPropertiesSidecard = () => {
    dispatch(resetPropertiesLayer());
  };

  const toggleLayerStyleSidecard = () => {
    if (rightSideCard === WorkspaceRightSideCard.FeatureStyling) {
      dispatch(setRightSideCard(WorkspaceRightSideCard.None));
    } else {
      dispatch(setRightSideCard(WorkspaceRightSideCard.FeatureStyling));
    }
  };

  // Modal Handlers.
  const showCreateLayerModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      createLayerModal: true,
    }));

  const hideCreateLayerModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      createLayerModal: false,
    }));

  const showSelectTerrainModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      selectTerrainModal: true,
    }));

  const hideSelectTerrainModal = () =>
    setShowModals((prevShowModals) => ({
      ...prevShowModals,
      selectTerrainModal: false,
    }));

  return (
    <div className="map-3d-workspace-container">
      {/* To display the left sidecard of active layers */}
      <SideBarCard
        className="aus-sidebar-item__sidecard map-3d-sidebar-card"
        title={'Workspace'}
        show={activeSidebarOption?.isHidden}
        onClose={onCloseSidebarCard}
      >
        <WorkSpaceBody />
        <SelectTerrainFooter onButtonClick={showSelectTerrainModal} />
      </SideBarCard>

      {/* Workspace Toolbox */}
      {currentEditableLayerId && <WorkSpaceToolbox />}

      {/* Select Dataset Sidecard */}
      <SelectDatasetSidecard
        onClickCreateLayer={showCreateLayerModal}
        show={rightSideCard === WorkspaceRightSideCard.Dataset}
        onClose={onCloseSidecard}
      />

      {/* Layer Info Sidecard */}
      <LayerPropertiesSidecard
        show={showLayerPropertiesSidecard}
        onClose={onCloseLayerPropertiesSidecard}
      />

      {/* Layer Styling Sidecard */}
      {currentEditableLayerId && (
        <LayerStylingSidecard
          show={showLayerStyleSidecard}
          onClose={onCloseSidecard}
          onToggle={toggleLayerStyleSidecard}
        />
      )}

      {/* Modals */}
      {showModals.createLayerModal && (
        <CreateLayerModal onHide={hideCreateLayerModal} />
      )}
      {/* TODO: Move to Sidebar component after refactoring sidebar component */}
      {showModals.selectTerrainModal && (
        <SelectTerrainModal onHide={hideSelectTerrainModal} />
      )}
    </div>
  );
};
