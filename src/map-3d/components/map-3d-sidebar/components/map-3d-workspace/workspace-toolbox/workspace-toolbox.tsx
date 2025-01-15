import {
  Button,
  ButtonVariant,
  IconButton,
  IconIdentifier,
  toast,
} from '@aus-platform/design-system';
import { intersection, isEmpty, isNil, unionBy, uniqBy } from 'lodash';
import React, { useEffect, useRef, useState } from 'react';
import { AddTextboxModal, UnsavedFeaturesModal } from '../modals';
import {
  WorkspaceRightSideCard,
  refetchLayer,
  selectMap3dWorkspace,
  selectWorkspaceActionableLayers,
  setRightSideCard,
  setShowUnsavedFeaturesModal,
  updateWorkspaceLayer,
  exitEditableLayer,
} from 'map-3d/shared/map-3d-slices';
import {
  SelectToolEventType,
  TextboxEventType,
} from 'map-3d/shared/map-3d-tools';
import {
  Feature,
  handleResponseErrorMessage,
  useBulkAddFeatures,
  useBulkDeleteFeatures,
  useBulkUpdateFeatures,
} from 'shared/api';
import { ConfirmationModal } from 'shared/components';
import { useAppDispatch, useAppSelector } from 'src/app/hooks';
import { WorkspaceTools } from 'map-3d/shared/map-3d-tools/enums';

export const WorkSpaceToolbox: React.FC = () => {
  // States.
  const [currentActiveTool, setCurrentActiveTool] =
    useState<WorkspaceTools | null>(null);
  const [showAddTextboxModal, setShowAddTextboxModal] = useState(false);
  const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] =
    useState(false);
  const [isAnyFeatureSelected, setIsAnyFeatureSelected] = useState(false);

  // Selectors.
  const {
    drawingTools,
    currentEditableLayerId,
    showUnsavedFeaturesModal,
    actionTools,
  } = useAppSelector(selectMap3dWorkspace);
  const { currentEditableLayer } = useAppSelector(
    selectWorkspaceActionableLayers,
  );

  // Hooks.
  const dispatch = useAppDispatch();

  // Constants.
  const styleOptions = {
    pointStyleOptions: currentEditableLayer?.featuresStyles?.point,
    polygonStyleOptions: currentEditableLayer?.featuresStyles?.polygon,
    lineStyleOptions: currentEditableLayer?.featuresStyles?.line,
    textboxStyleOptions: currentEditableLayer?.featuresStyles?.textbox,
  };

  // Refs.
  const exportedFeatures = useRef<Feature[]>();

  /*
   * When the style changes, a new map layer is added with the updated style.
   * We need to track the latest mapLayer on unmount to change its visibility.
   * We cannot directly use the editableLayer.mapLayer state because we want the updated
   * mapLayer value on unmount. To get the updated state value, we would have to add
   * editableLayer.mapLayer to the dependency array of the useEffect performing cleanup.
   * By doing that, the cleanup function to clear the Cesium vector layer from the map
   * and add the imagery layer would run every time the editableLayer.mapLayer state changes,
   * whereas we want the cleanup function to run only on unmount.
   * Therefore, we use useRef to store the latest value of editableLayer?.mapLayer,
   * whose visibility needs to be changed when the toolbox is unmounted (i.e., when exiting editing mode).
   */
  const mapLayerRef = useRef(currentEditableLayer?.mapLayer);

  // Api.
  const {
    mutate: sendBulkAddFeatureRequest,
    data: bulkAddFeaturesResponse,
    isSuccess: isSuccessBulkAddFeatures,
    isPending: isLoadingBulkAddFeatures,
    isError: isErrorBulkAddFeatures,
    error: bulkAddFeaturesErrorResponse,
  } = useBulkAddFeatures();

  const {
    mutate: sendBulkUpdateFeatureRequest,
    data: bulkUpdateFeaturesResponse,
    isSuccess: isSuccessBulkUpdateFeatures,
    isPending: isLoadingBulkUpdateFeatures,
    isError: isErrorBulkUpdateFeatures,
    error: bulkUpdateFeaturesErrorResponse,
  } = useBulkUpdateFeatures();

  const {
    mutate: sendBulkDeleteFeatureRequest,
    data: bulkDeleteFeaturesResponse,
    isPending: isLoadingBulkDeleteFeature,
    isSuccess: isSuccessBulkDeleteFeatures,
    isError: isErrorBulkDeleteFeatures,
    error: bulkDeleteFeaturesErrorResponse,
  } = useBulkDeleteFeatures();

  // useEffect - Mount.
  useEffect(() => {
    // Activate default tool (i.e Select tool).
    onClickSelectTool();

    return () => {
      exitWorkspace();

      if (mapLayerRef.current) {
        mapLayerRef.current.show = true;
      }

      actionTools?.selectFeatureTool.removeEventListener(
        SelectToolEventType.FeatureSelected,
        selectFeatureListener,
      );
    };
  }, []);

  // Storing the latest mapLayer
  useEffect(() => {
    if (!isNil(currentEditableLayer)) {
      mapLayerRef.current = currentEditableLayer.mapLayer;
    }
  }, [currentEditableLayer?.mapLayer]);

  // useEffect - Bulk Add response message handling.
  useEffect(() => {
    handleResponseErrorMessage(
      isErrorBulkAddFeatures,
      bulkAddFeaturesErrorResponse,
    );
  }, [isErrorBulkAddFeatures, bulkAddFeaturesErrorResponse]);

  // useEffect - Bulk Update response message handling.
  useEffect(() => {
    handleResponseErrorMessage(
      isErrorBulkUpdateFeatures,
      bulkUpdateFeaturesErrorResponse,
    );
  }, [isErrorBulkUpdateFeatures, bulkUpdateFeaturesErrorResponse]);

  // useEffect - Bulk Delete response message handling.
  useEffect(() => {
    handleResponseErrorMessage(
      isErrorBulkDeleteFeatures,
      bulkDeleteFeaturesErrorResponse,
    );
  }, [isErrorBulkDeleteFeatures, bulkDeleteFeaturesErrorResponse]);

  // useEffect - Bulk Add.
  useEffect(() => {
    if (isSuccessBulkAddFeatures && bulkAddFeaturesResponse) {
      // Reset all added drawn features array.
      drawingTools?.resetAllDrawnFeatureArrays(true);
      updateCurrentEditableLayer();
      toast.success('Layer saved successfully');
    }
  }, [bulkAddFeaturesResponse, isSuccessBulkAddFeatures]);

  // useEffect - Bulk Update.
  useEffect(() => {
    if (isSuccessBulkUpdateFeatures && bulkUpdateFeaturesResponse) {
      // Reset all edited drawn features array.
      drawingTools?.resetAllEditedFeatureArrays();

      if (currentEditableLayer?.id) {
        updateCurrentEditableLayer();
        // Refetch layer data to update feature count.
        dispatch(refetchLayer({ id: currentEditableLayer.id }));
      }

      toast.success('Layer saved successfully');
    }
  }, [bulkUpdateFeaturesResponse, isSuccessBulkUpdateFeatures]);

  useEffect(() => {
    if (isSuccessBulkDeleteFeatures && bulkDeleteFeaturesResponse) {
      toast.success('Feature(s) deleted successfully');
      actionTools?.selectFeatureTool.deleteSelectedFeatures();
      drawingTools?.resetAllDeletedFeatureArrays();
      setShowDeleteConfirmationModal(false);
      updateCurrentEditableLayer();

      setIsAnyFeatureSelected(false);
    }
  }, [isSuccessBulkDeleteFeatures, bulkDeleteFeaturesResponse]);

  // useEffect - Handle warning message for unsaved features when clicked on back, reload and close button.
  useEffect(() => {
    /**
     * Back button resets the state even after doing preventDefault.
     * Adding a state using push state prevents this behaviour.
     */
    window.history.pushState({ currentActiveTool }, '', '');
    window.addEventListener('popstate', function (event) {
      if (drawingTools?.checkUnsavedFeatures()) {
        event.preventDefault();
        dispatch(setShowUnsavedFeaturesModal(true));
      }
    });

    window.addEventListener('beforeunload', function (event) {
      if (drawingTools?.checkUnsavedFeatures()) {
        event.preventDefault();
        // A non-empty string is required for Chrome browsers to display confirmation message.
        return (event.returnValue = 'Are you sure you want to leave the page?');
      }
    });
  }, []);

  // Handlers
  const onClickExit = () => {
    if (drawingTools?.checkUnsavedFeatures()) {
      dispatch(setShowUnsavedFeaturesModal(true));
    } else {
      /**
       * Currently, we are removing tile from cache in aereo cesium,
       * so we don't need to refresh layer on exit.
       */
      exitWorkspace();
    }
  };

  // Separate Handler for Save and Exit button in modal b/c currentEditableLayer should also be set to null which is not the case when we do save from the toolbox.
  const onSaveAndExitModal = () => {
    onSaveFeatures();
    exitWorkspace(true, true);
    dispatch(setShowUnsavedFeaturesModal(false));
  };

  const onExitUnsavedChangesModal = () => {
    if (currentEditableLayerId && drawingTools) {
      exitWorkspace();
      dispatch(setShowUnsavedFeaturesModal(false));
    }
  };

  const onClickTextboxTool = () => {
    setCurrentActiveTool(WorkspaceTools.TextboxTool);
    deactivateActionTools();
    drawingTools?.activateTextboxTool(
      { layerId: currentEditableLayerId },
      styleOptions,
    );
    drawingTools?.textboxTool.addEventListener(
      TextboxEventType.ReadyTextboxDraw,
      handleAddTextbox,
    );
  };

  const onClickPolygonTool = () => {
    setCurrentActiveTool(WorkspaceTools.PolygonTool);
    deactivateActionTools();
    drawingTools?.activatePolygonTool(
      { layerId: currentEditableLayerId, isLabelSizeFixed: false },
      styleOptions,
    );
  };

  const onClickLineTool = () => {
    setCurrentActiveTool(WorkspaceTools.LineTool);
    deactivateActionTools();
    drawingTools?.activateLineTool(
      { layerId: currentEditableLayerId, isLabelSizeFixed: false },
      styleOptions,
    );
  };

  const onClickPointTool = () => {
    setCurrentActiveTool(WorkspaceTools.PointTool);
    deactivateActionTools();

    drawingTools?.activatePointTool(
      { layerId: currentEditableLayerId },
      styleOptions,
    );
  };

  const onClickDelete = () => {
    if (drawingTools) {
      const selectedIds = actionTools?.selectFeatureTool.selectedFeatures.map(
        (feature) => feature.id,
      );

      if (selectedIds) {
        if (
          intersection(selectedIds, drawingTools.loadedFeatureIds).length > 0
        ) {
          sendBulkDeleteFeatureRequest(selectedIds);
        } else {
          actionTools?.selectFeatureTool.deleteSelectedFeatures();
          drawingTools?.resetAllDeletedFeatureArrays();
          setShowDeleteConfirmationModal(false);
        }
      }
    }
  };

  const onClickSelectTool = () => {
    const selectFeatureTool = actionTools?.selectFeatureTool;

    if (
      isNil(currentActiveTool) ||
      currentActiveTool !== WorkspaceTools.SelectFeatureTool
    ) {
      setCurrentActiveTool(WorkspaceTools.SelectFeatureTool);
      drawingTools?.activateEditingListeners();

      selectFeatureTool?.activate({
        layerId: currentEditableLayerId,
      });
      selectFeatureTool?.addEventListener(
        SelectToolEventType.FeatureSelected,
        selectFeatureListener,
      );
    } else {
      setCurrentActiveTool(null);
      setIsAnyFeatureSelected(false);
      selectFeatureTool?.deselectSelectedFeatures();
      selectFeatureTool?.deactivate();
    }
  };

  const onSaveFeatures = () => {
    if (currentEditableLayerId && drawingTools) {
      const newFeatures: Feature[] = drawingTools.exportNewFeatures(
        currentEditableLayerId,
      );

      const editedFeatures: Feature[] = drawingTools.exportEditedFeatures(
        currentEditableLayerId,
      );

      exportedFeatures.current = unionBy(newFeatures, editedFeatures, 'id');

      // Remove FeatureObj (feature key) from exported features.
      const modifiedNewFeatures = newFeatures.map((feature) => {
        return { ...feature, feature: undefined };
      });

      const modifiedEditedFeatures = editedFeatures.map((feature) => {
        return { ...feature, feature: undefined, layer: undefined };
      });

      if (!isEmpty(modifiedNewFeatures)) {
        sendBulkAddFeatureRequest(modifiedNewFeatures);
      }

      if (!isEmpty(modifiedEditedFeatures)) {
        sendBulkUpdateFeatureRequest(modifiedEditedFeatures);
      }
    }
  };

  const handleAddTextbox = () => {
    displayAddTextboxModal();
  };

  const onAddTextBoxClick = (text: string) => {
    drawingTools?.textboxTool.createTextbox(text);
    hideAddTextboxModal();
  };

  // Modal handlers.
  const displayAddTextboxModal = () => {
    setShowAddTextboxModal(true);
  };

  const hideAddTextboxModal = () => {
    setShowAddTextboxModal(false);
  };

  // Helpers.
  const deactivateActionTools = () => {
    actionTools?.deactivateAllTools();
    setIsAnyFeatureSelected(false);
  };

  const exitWorkspace = (saveFeatures = false, refreshLayer = true): void => {
    if (saveFeatures) {
      updateCurrentEditableLayer();
    }
    drawingTools?.resetAllUnsavedFeatures(saveFeatures);

    dispatch(
      exitEditableLayer({
        refreshRequired: refreshLayer,
      }),
    );

    dispatch(setRightSideCard(WorkspaceRightSideCard.None));
  };

  const updateCurrentEditableLayer = () => {
    if (isNil(currentEditableLayer)) {
      return;
    }

    const updatedFeatures: Feature[] = [];

    if (exportedFeatures.current) {
      updatedFeatures.push(...exportedFeatures.current);
    }

    if (currentEditableLayer.features) {
      updatedFeatures.push(...currentEditableLayer.features);
    }

    const uniqueUpdatedFeatures = uniqBy(updatedFeatures, (val) => val.id);

    // Store features into layer object.
    const updatedVectorLayer = {
      [currentEditableLayer.id]: {
        ...currentEditableLayer,
        features: uniqueUpdatedFeatures,
      },
    };

    if (bulkAddFeaturesResponse) {
      updatedVectorLayer[currentEditableLayer.id].featuresCount = {
        ...bulkAddFeaturesResponse.data.featuresCount,
      };
    }

    if (bulkDeleteFeaturesResponse) {
      updatedVectorLayer[currentEditableLayer.id].featuresCount = {
        ...bulkDeleteFeaturesResponse.data.featuresCount,
      };
    }

    dispatch(updateWorkspaceLayer(updatedVectorLayer));
  };

  const selectFeatureListener = () => {
    if (actionTools?.selectFeatureTool) {
      setIsAnyFeatureSelected(
        actionTools?.selectFeatureTool.selectedFeatureCount > 0,
      );
    }
  };

  return (
    <>
      <div className="workspace-toolbox">
        <div className="workspace-toolbox__feature-actions">
          <IconButton
            className="delete-btn"
            iconIdentifier={IconIdentifier.Bin}
            onClick={() => setShowDeleteConfirmationModal(true)}
            disabled={!isAnyFeatureSelected}
          />
          <IconButton
            className="selection-btn"
            iconIdentifier={IconIdentifier.Cursor}
            onClick={onClickSelectTool}
            isActive={currentActiveTool === WorkspaceTools.SelectFeatureTool}
          />
        </div>
        <div className="workspace-toolbox__drawing-tools">
          <IconButton
            iconIdentifier={IconIdentifier.Point}
            className="point-tool-btn"
            onClick={onClickPointTool}
            isActive={
              currentActiveTool === WorkspaceTools.PointTool &&
              drawingTools?.pointTool.isActive
            }
          />

          <IconButton
            iconIdentifier={IconIdentifier.Line}
            className="line-tool-btn"
            onClick={onClickLineTool}
            isActive={
              currentActiveTool === WorkspaceTools.LineTool &&
              drawingTools?.lineTool.isActive
            }
          />

          <IconButton
            iconIdentifier={IconIdentifier.Polygon}
            className="polygon-tool-btn"
            onClick={onClickPolygonTool}
            isActive={
              currentActiveTool === WorkspaceTools.PolygonTool &&
              drawingTools?.polygonTool.isActive
            }
          />
          <IconButton
            iconIdentifier={IconIdentifier.Textbox}
            className="textbox-tool-btn"
            onClick={onClickTextboxTool}
            isActive={
              currentActiveTool === WorkspaceTools.TextboxTool &&
              drawingTools?.textboxTool.isActive
            }
          />
        </div>
        <div className="workspace-toolbox__layer-actions">
          <Button
            rightIconIdentifier={IconIdentifier.Save}
            variant={ButtonVariant.Link}
            onClick={onSaveFeatures}
            isLoading={isLoadingBulkAddFeatures || isLoadingBulkUpdateFeatures}
          >
            Save
          </Button>
          <Button
            rightIconIdentifier={IconIdentifier.BoxArrowOutToRight}
            variant={ButtonVariant.Link}
            onClick={onClickExit}
            disabled={
              isLoadingBulkAddFeatures ||
              isLoadingBulkUpdateFeatures ||
              isLoadingBulkDeleteFeature
            }
          >
            Exit
          </Button>
        </div>
        <UnsavedFeaturesModal
          show={showUnsavedFeaturesModal}
          onSaveAndExit={onSaveAndExitModal}
          onExit={onExitUnsavedChangesModal}
        />

        {showAddTextboxModal && (
          <AddTextboxModal
            onHide={hideAddTextboxModal}
            onAddTextBoxClick={onAddTextBoxClick}
          />
        )}

        {showDeleteConfirmationModal && (
          <ConfirmationModal
            message="Are you sure you want to delete?"
            onSubmit={onClickDelete}
            onClose={() => setShowDeleteConfirmationModal(false)}
          />
        )}
      </div>
    </>
  );
};
