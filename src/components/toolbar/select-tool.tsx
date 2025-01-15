/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { CesiumLayer, FeatureInfoType, MapTool } from '@aus-platform/cesium';
import { Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { SelectToolProps } from './types';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import FeatureTable from '../common/feature-table';

const SelectTool: React.FC<SelectToolProps> = ({ id, enabled, viewer }) => {
  const [features, setFeatures] = useState<FeatureInfoType[]>([]);
  const [featureIds, setFeatureIds] = useState('');
  const [layersList, setLayersList] = useState<CesiumLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const cesiumViewer = viewer.viewer;
  const layerTool = cesiumViewer?.layerTool;

  const selectTools = cesiumViewer?.selectTools.selectFeatureTool;
  const selectTool = selectTools?.selectFeature;

  useEffect(() => {
    setFeatures(selectTool!.selectedFeatures);
  }, [[...selectTool!.selectedFeatures]]);

  const listenerSelectFeature = ([featureInfo]) => {
    console.info('selected feature event triggered', featureInfo);
    setFeatures([...selectTool!.selectedFeatures]);
  };

  const listenerDeselectFeature = ([featureInfo]) => {
    console.info('deselected feature event triggered', featureInfo);
    setFeatures([...selectTool!.selectedFeatures]);
  };

  const listenerDeleteFeature = (featureInfo) => {
    console.info('deleted feature event triggered', featureInfo);
    setFeatures([...selectTool!.selectedFeatures]);
  };

  const listenerDeleteAllFeature = () => {
    console.info('deleted all feature event triggered');
    setFeatures([...selectTool!.selectedFeatures]);
  };

  const listenerReset = () => {
    console.info('reset tool event triggered');
    setFeatures([...selectTool!.selectedFeatures]);
  };

  const listenerActiveLayerChanged = () => {
    console.info('Active Layer Changed');
    setActiveLayer(layerTool!.activeLayer!.id);
  };
  // Enable select tool
  const onEnableSelect = () => {
    if (!viewer || !selectTools || !selectTool) {
      logger.error('Viewer is being loaded');
      return;
    }
    cesiumViewer.deactivateCurrentMapTool();
    selectTools.activateSelectFeature({ layer: activeLayer });
  };

  // Disable select tool
  const onDisableSelect = () => {
    if (!viewer || !selectTools || !selectTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    selectTool.deactivate();
    cesiumViewer.deactivateCurrentMapTool();
  };

  // Delete all selected features
  const onDeleteAll = () => {
    if (!viewer || !selectTools || !selectTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    selectTools.activateSelectFeature();
    selectTool.deleteAllSelectedFeatures();
    cesiumViewer.deactivateCurrentMapTool();
  };

  // Deselect all selected features
  const onReset = () => {
    if (!viewer || !selectTools || !selectTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    selectTool.reset();
    cesiumViewer.deactivateCurrentMapTool();
  };

  // export wkt for all selected features
  const onExportWKTAll = () => {
    if (!viewer || !selectTools || !selectTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    selectTools.activateSelectFeature();
    console.info(selectTool.exportWKTAll());
    cesiumViewer.deactivateCurrentMapTool();
  };

  const onDeselectFeature = (featureId: string) => {
    const featureInfo = selectTool?.getFeatureInfoById(featureId);
    if (featureInfo) selectTool?.deselectFeature(featureInfo);
  };

  const onEnableEdit = () => {
    if (!cesiumViewer) return;
    const editFeatureIds = featureIds.split(',');
    MapTool.enableEdit(cesiumViewer, editFeatureIds);
  };

  const onDisableEdit = () => {
    if (!cesiumViewer) return;
    MapTool.disableEdit(cesiumViewer);
  };

  useEffect(() => {
    setFeatures(selectTool!.selectedFeatures);
  }, [selectTool!.selectedFeatures]);

  useEffect(() => {
    if (!selectTool || !layerTool) return;

    setLayersList(layerTool.layers);

    if (layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }

    selectTool.eventFeatureSelected.addEventListener(listenerSelectFeature);
    selectTool.eventFeatureDeselected.addEventListener(listenerDeselectFeature);
    selectTool.eventFeatureDelected.addEventListener(listenerDeleteFeature);
    selectTool.eventFeatureAllDeleted.addEventListener(listenerDeleteAllFeature);
    selectTool.eventReset.addEventListener(listenerReset);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);

    return () => {
      selectTool.eventFeatureSelected.removeEventListener(listenerSelectFeature);
      selectTool.eventFeatureDeselected.removeEventListener(listenerDeselectFeature);
      selectTool.eventFeatureDelected.removeEventListener(listenerDeleteFeature);
      selectTool.eventFeatureAllDeleted.removeEventListener(listenerDeleteAllFeature);
      selectTool.eventReset.removeEventListener(listenerReset);
      layerTool.eventActiveLayerChanged.removeEventListener(listenerActiveLayerChanged);
    };
  });

  const handleChangeLayer = (e) => {
    if (!cesiumViewer || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    setActiveLayer(e.target.value);
    layerTool.setActiveLayer(e.target.value);
  };

  const featureDataFields = [
    { id: 0, title: 'Type', key: 'type' },
    { id: 1, title: 'ID', key: 'id' }
  ];

  return (
    <div>
      <Box sx={{ p: 1 }}>
        <FormControl fullWidth>
          <InputLabel id="select-layer-label">Select active layer</InputLabel>
          <Select
            labelId="select-layer-label"
            id="select-layer-label-id"
            value={activeLayer}
            label="Layer"
            onChange={handleChangeLayer}
          >
            {layersList.map((layer) => (
              <MenuItem key={layer.id} value={layer.id}>
                {layer.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <div style={{ padding: '15px 0px' }}>
        <button type="button" id={id} disabled={!enabled} onClick={() => onEnableSelect()}>
          Select Feature
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onDisableSelect()}
        >
          Disable Select
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onDeleteAll()}
        >
          Delete All
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onReset()}
        >
          Reset
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onExportWKTAll()}
        >
          Export WKT
        </button>
      </div>

      <SidebarExpandedDivider />
      <div style={{ paddingTop: 15 }}>
        <p>List of selected features({features.length})</p>
        <div>
          {features.length > 0 && (
            <FeatureTable
              data={features}
              fields={featureDataFields}
              onDisableFeature={onDeselectFeature}
              onDeleteSelectedFeature={(featureId) => {
                // setSelectedName(data._name);
                // setSelectedId(data._id);
                selectTool?.deleteSelectedFeature(featureId);
              }}
              onExportWKT={(featureId) => {
                if (!cesiumViewer) return;
                console.info(selectTool?.exportWKTById(featureId));
              }}
            />
          )}
        </div>
      </div>
      <SidebarExpandedDivider />
      <div>
        <p style={{ marginTop: 20 }}>Input feature ids seperate by comma</p>
        <textarea
          rows={5}
          style={{ width: '90%' }}
          value={featureIds}
          onChange={(e) => {
            setFeatureIds(e.target.value);
          }}
        />
      </div>
      <SidebarExpandedDivider />
      <div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onEnableEdit()}
        >
          Enable Edit
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onDisableEdit()}
        >
          Disable Edit
        </button>
      </div>
    </div>
  );
};

export default SelectTool;
