/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { CesiumLayer, FeatureType } from '@aus-platform/cesium';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Slider,
  TextField
} from '@mui/material';
import { createGuid, Rectangle, Resource } from 'cesium';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import { LayerToolProps } from './types';
import FeatureTable from '../common/feature-table';
import { ORG_TOKEN } from '../../shared/constants';

const LayerTool = ({ id, enabled, viewer }: LayerToolProps) => {
  const cesiumViewer = viewer.viewer;
  const layerTool = cesiumViewer?.layerTool;
  const [layersList, setLayersList] = useState<CesiumLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const [activeLayerName, setActiveLayerName] = useState('');
  const [layerName, setLayerName] = useState('');
  const [isOpenModal, setIsOpenModal] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState('');
  const [rasterUrl, setRasterURL] = useState('');
  const [viewBounds, setViewBounds] = useState('');
  const [features, setFeatures] = useState<FeatureType[]>([]);
  const [layerOpacity, setLayerOpacity] = useState('1');

  const onCreateLayer = () => {
    if (!cesiumViewer || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const viewBound = viewBounds.split(',');
    const [minZoom, maxZoom] = zoomLevel.split(',');
    layerTool.addLayer({
      id: createGuid(),
      name: layerName,
      hasRaster: !(rasterUrl === ''),
      isActive: false,
      rasterLayerOptions: {
        url: new Resource({
          url: rasterUrl,
          headers: {
            'X-Org-Access-Token': ORG_TOKEN
          }
        }),
        rectangle: Rectangle.fromDegrees(
          parseFloat(viewBound[0]),
          parseFloat(viewBound[1]),
          parseFloat(viewBound[2]),
          parseFloat(viewBound[3])
        ),
        minimumLevel: parseFloat(minZoom),
        maximumLevel: parseFloat(maxZoom)
      },
      viewer: cesiumViewer,
      show: true
    });

    setIsOpenModal(false);
  };

  // const handleChangeLayer = (e) => {
  //   if (!cesiumViewer || !layerTool) {
  //     logger.error('Viewer is being loaded');
  //     return;
  //   }

  //   layerTool.setActiveLayer(e.target.value);
  // };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleOpenModal = () => {
    setIsOpenModal(true);
  };

  const handleChangeLayerName = () => {
    if (!layerTool || !layerTool.activeLayer) return;
    layerTool.setActiveLayerName(activeLayerName);
  };

  const onChangeLayerName = (e) => {
    setActiveLayerName(e.target.value);
  };

  const handleChangeOpacity = (event, value) => {
    setLayerOpacity(value.toString());

    if (!layerTool || !layerTool.activeLayer) {
      return;
    }

    layerTool.activeLayer.opacity = value;
  };

  const listenerLayerCreated = () => {
    console.info('Layer Created');
    setLayersList([...layerTool!.layers]);
  };

  const getFeatureArray = () => {
    const featureArray: FeatureType[] = [];
    if (!cesiumViewer || !layerTool || !layerTool.activeLayer) return;
    const { drawingTools } = cesiumViewer;
    const { polygonDrawingTools, lineDrawingTools, pointDrawingTools } = drawingTools;

    const polygons = polygonDrawingTools.polygonDrawing.polygons;
    for (let i = 0; i < polygons.length; i++) {
      if (polygons[i].hasProperty({ layer: layerTool.activeLayer.id })) {
        featureArray.push(polygons[i]);
      }
    }

    const lines = lineDrawingTools.lineDrawing.lines;
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].hasProperty({ layer: layerTool.activeLayer.id })) {
        featureArray.push(lines[i]);
      }
    }

    const points = pointDrawingTools.pointDrawing.points;
    for (let i = 0; i < points.length; i++) {
      if (points[i].hasProperty({ layer: layerTool.activeLayer.id })) {
        featureArray.push(points[i]);
      }
    }

    return featureArray;
  };

  const listenerActiveLayerChanged = () => {
    console.info('Active Layer Changed');
    if (!cesiumViewer || !layerTool || !layerTool.activeLayer) return;
    setActiveLayerName(layerTool.activeLayer.name);
    setActiveLayer(layerTool.activeLayer.id);

    const featureArray = getFeatureArray();
    if (!featureArray) return;
    setFeatures([...featureArray]);
  };

  const listenerActiveLayerNameChanged = () => {
    console.info('Active Layer Name Changed');
    if (!layerTool || !layerTool.activeLayer) return;
    setActiveLayer(layerTool.activeLayer.id);
  };

  useEffect(() => {
    if (!cesiumViewer || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    setLayersList([...layerTool.layers]);
    if (layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }

    const featureArray = getFeatureArray();
    if (!featureArray) return;
    setFeatures([...featureArray]);

    layerTool.eventLayerAdded.addEventListener(listenerLayerCreated);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);
    layerTool.eventActiveLayerNameChanged.addEventListener(listenerActiveLayerNameChanged);

    return () => {
      layerTool.eventLayerAdded.removeEventListener(listenerLayerCreated);
      layerTool.eventActiveLayerChanged.removeEventListener(listenerActiveLayerChanged);
      layerTool.eventActiveLayerNameChanged.removeEventListener(listenerActiveLayerNameChanged);
    };
  });

  const featureDataFields = [
    { id: 0, title: 'Name', key: 'name' },
    { id: 1, title: 'ID', key: 'id' }
  ];

  const onClickEnableEdit = (data) => {
    if (layerTool) {
      layerTool.setActiveLayer(data._id);
    }
  };

  const onClickDisableEdit = () => {
    console.info('disable edit');
  };

  const onToggleVisibility = (featureId) => {
    console.info('toggle visible', featureId);
    if (layerTool) {
      layerTool.toggleVisibilityById(featureId);
    }
  };

  useEffect(() => {
    if (layerTool && layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }
  }, [layerTool]);

  return (
    <div>
      <SidebarExpandedDivider />
      <Box sx={{ p: 1 }}>
        <Button
          variant="outlined"
          onClick={handleOpenModal}
          size="small"
          id={id}
          disabled={!enabled}
        >
          Create Layer
        </Button>
      </Box>
      <SidebarExpandedDivider />
      <Box>
        {layersList.length > 0 && (
          <FeatureTable
            data={layersList}
            fields={featureDataFields}
            onEditFeature={(data) => onClickEnableEdit(data)}
            onDisableFeature={() => onClickDisableEdit()}
            onToggleVisibility={(featureId) => onToggleVisibility(featureId)}
          />
        )}
      </Box>
      <SidebarExpandedDivider />
      <Box sx={{ p: 1 }}>
        <TextField
          id="filled-basic"
          label="Layer name"
          variant="filled"
          size="small"
          fullWidth
          value={activeLayerName}
          onChange={onChangeLayerName}
        />
        <Button variant="outlined" onClick={handleChangeLayerName} size="small" sx={{ mt: 1 }}>
          Change Layer
        </Button>
        <p style={{ paddingTop: 15 }}>Opacity:</p>
        <div className="flex-space-between">
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            defaultValue={2}
            aria-label="Small"
            valueLabelDisplay="auto"
            value={parseFloat(layerOpacity)}
            onChange={handleChangeOpacity}
          />
        </div>
      </Box>
      <SidebarExpandedDivider />
      <Box sx={{ p: 1 }}>
        {features.length > 0 && (
          <FeatureTable
            data={features}
            fields={featureDataFields}
            onEditFeature={onClickEnableEdit}
            activeId={activeLayer}
          />
        )}
      </Box>
      <Dialog open={isOpenModal} onClose={handleCloseModal}>
        <DialogTitle>Create Layer</DialogTitle>
        <DialogContent style={{ width: 400 }}>
          <Box>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Enter layer name"
              type="text"
              fullWidth
              variant="standard"
              value={layerName}
              onChange={(e) => setLayerName(e.target.value)}
            />
          </Box>
          <Box>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Enter raster url"
              type="text"
              fullWidth
              variant="standard"
              value={rasterUrl}
              onChange={(e) => setRasterURL(e.target.value)}
            />
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Enter view bounds by comma"
              type="text"
              fullWidth
              variant="standard"
              value={viewBounds}
              onChange={(e) => setViewBounds(e.target.value)}
            />
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="Enter min, max zoom level by comma"
              type="text"
              fullWidth
              variant="standard"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={onCreateLayer}>Create layer</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default LayerTool;
