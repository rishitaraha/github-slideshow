/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { CesiumLayer, DrawingMode, Polygon } from '@aus-platform/cesium';
import {
  Box,
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Slider
} from '@mui/material';
import { AiOutlineClose } from 'react-icons/ai';
import { SketchPicker } from 'react-color';
import Switch from '@mui/material/Switch';
import FeatureTable from '../common/feature-table';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import { PolygonDrawingToolProps } from './types';

const deleteOption = {
  canDelete: true
};

const PolygonDrawingTool = ({ id, enabled, viewer }: PolygonDrawingToolProps) => {
  const [polygons, setPolygons] = useState<Polygon[]>([]);
  // const [importedPolygons, setImportedPolygons] = useState<Polygon[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [wktString, setWktString] = useState('');
  const [idString, setIdString] = useState('');
  const [isEnableDrawing, setIsEnableDrawing] = useState(true);
  const [polygonFillColor, setPolygonFillColor] = useState('#000000');
  const [polygonStrokeColor, setPolygonStrokeColor] = useState('#000000');
  const [polygonStrokeThickness, setPolygonStrokeThickness] = useState('2');
  const [polygonLabel, setPolygonLabel] = useState('');
  const [polygonLabelColor, setPolygonLabelColor] = useState('#000000');
  const [polygonOpacity, setPolygonOpacity] = useState('1');
  const [layersList, setLayersList] = useState<CesiumLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const [anchor, setAnchor] = useState<any>(null);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState('#000000');
  const [clampToGround, setClampToGround] = useState(true);
  const [toggleFillColor, setToggleFillColor] = useState(false);

  const togglePopover = (event) => {
    setAnchor(event.currentTarget);
    setOpenColorPicker(true);
  };

  const handleColorChange = (color) => {
    setPickedColor(color);

    if (!anchor) return;
    if (anchor.id === 'polygon_label_color') {
      setPolygonLabelColor(color.hex);
    }
    if (anchor.id === 'polygon_fill_color') {
      setPolygonFillColor(color.hex);
    }
    if (anchor.id === 'polygon_stroke_color') {
      setPolygonStrokeColor(color.hex);
    }
  };

  const onCloseColorPicker = () => {
    setOpenColorPicker(false);
  };

  const cesiumViewer = viewer.viewer;

  const drawingTools = cesiumViewer?.drawingTools.polygonDrawingTools;
  const drawingTool = drawingTools?.polygonDrawing;
  const layerTool = cesiumViewer?.layerTool;

  const listenerVertexCreated = () => {
    console.info('VertexCreatedWhileDrawing event triggered!');
  };
  const listenerPolygonCreated = () => {
    console.info('PolygonCreated event triggered!');
    setPolygons([...drawingTool!.polygons]);
    // Check label functionality
    for (let i = 0; i < polygons.length; i++) {
      polygons[i].setLabel('text1234');
    }
  };
  const listenerVertexModified = () => {
    console.info('VertexModifiedInPolygon event triggered!');
  };
  const listenerVertexAdded = () => {
    console.info('VertexAddedInPolygon event triggered!');
  };
  const listenerVertexDeleted = () => {
    console.info('VertexDeleted event triggered!');
  };
  const listenerPolygonDeleted = () => {
    console.info('PolygonDeleted event triggered!');
  };

  const listnerPolygonDrawingStarted = () => {
    console.info('Polygon drawing started');
    setIsEnableDrawing(false);
  };
  const listnerPolygonDrawingEnd = () => {
    console.info('Polygon drawing end');
    setIsEnableDrawing(true);
  };

  const listenerActiveLayerChanged = () => {
    console.info('Active Layer Changed');
    setActiveLayer(layerTool!.activeLayer!.id);
  };

  // Enable drawing tool
  const onClickMultipleDraw = () => {
    if (!viewer || !drawingTools || !drawingTool || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!layerTool.activeLayer) {
      alert('Please select a layer to draw');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    drawingTools.activatePolygonDrawing({}, {}, { canDelete: true }, { canSelect: true });
    drawingTool.enableMultipleDrawing();
  };

  const onClickSingleDraw = () => {
    if (!viewer || !drawingTools || !drawingTool || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!layerTool.activeLayer) {
      alert('Please select a layer to draw');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    if (!drawingTool.styleOptions) {
      drawingTools.activatePolygonDrawing(
        undefined,
        {
          polygonStyleOptions: {
            fillColor: '#FF0000',
            strokeColor: '#00FF00',
            strokeThickness: 5,
            label: 'polygon-label1',
            opacity: 0.7
          }
        },
        deleteOption,
        { canSelect: true }
      );
    } else {
      drawingTools.activatePolygonDrawing();
    }

    drawingTool.enableSingleDrawing();
  };

  const onToggleClampToGround = () => {
    if (!viewer || !drawingTool || !drawingTools) {
      logger.error('Viewer is being loaded');
      return;
    }
    drawingTool.toggleClampToGround(!clampToGround);
    setClampToGround(!clampToGround);
  };

  useEffect(() => {
    if (!drawingTool || !layerTool) return;

    setPolygons(drawingTool!.polygons);
    setLayersList(layerTool.layers);

    if (layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }

    drawingTool.eventVertexCreatedWhileDrawing.addEventListener(listenerVertexCreated);
    drawingTool.eventPolygonCreated.addEventListener(listenerPolygonCreated);
    drawingTool.eventVertexModifiedInPolygon.addEventListener(listenerVertexModified);
    drawingTool.eventVertexAddedInPolygon.addEventListener(listenerVertexAdded);
    drawingTool.eventVertexDeletedInPolygon.addEventListener(listenerVertexDeleted);
    drawingTool.eventPolygonDeleted.addEventListener(listenerPolygonDeleted);
    drawingTool.eventPolygonDrawingStarted.addEventListener(listnerPolygonDrawingStarted);
    drawingTool.eventPolygonDrawingEnd.addEventListener(listnerPolygonDrawingEnd);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);

    return () => {
      drawingTool.eventVertexCreatedWhileDrawing.removeEventListener(listenerVertexCreated);
      drawingTool.eventPolygonCreated.removeEventListener(listenerPolygonCreated);
      drawingTool.eventVertexModifiedInPolygon.removeEventListener(listenerVertexModified);
      drawingTool.eventVertexAddedInPolygon.removeEventListener(listenerVertexAdded);
      drawingTool.eventVertexDeletedInPolygon.removeEventListener(listenerVertexDeleted);
      drawingTool.eventPolygonDeleted.removeEventListener(listenerPolygonDeleted);
      drawingTool.eventPolygonDrawingStarted.removeEventListener(listnerPolygonDrawingStarted);
      drawingTool.eventPolygonDrawingEnd.removeEventListener(listnerPolygonDrawingEnd);
      layerTool.eventActiveLayerChanged.removeEventListener(listenerActiveLayerChanged);
    };
  });

  useEffect(() => {
    if (drawingTool!.mode === DrawingMode.Drawing) {
      setIsEnableDrawing(false);
    } else {
      setIsEnableDrawing(true);
    }
  }, [drawingTool!.mode]);

  useEffect(() => {
    const polygonIndex = polygons.findIndex((polygon) => polygon.id === selectedId);
    if (polygonIndex >= 0) {
      if (toggleFillColor) {
        polygons[polygonIndex].changeFillColor(polygonFillColor, 1);
      } else {
        polygons[polygonIndex].resetFillColor();
      }
    }
  }, [toggleFillColor]);

  const onClickRemove = () => {
    if (!viewer || !drawingTools) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!drawingTools.polygonDrawing.isActive()) {
      cesiumViewer.deactivateCurrentMapTool();
      drawingTools.activatePolygonDrawing();
    }

    drawingTools.deleteAllPolygons();
    cesiumViewer.deactivateCurrentMapTool();
  };

  const onClickDisableEdit = () => {
    if (!viewer || !drawingTools) {
      logger.error('Viewer is being loaded');
      return;
    }
    if (drawingTools.polygonDrawing.isActive()) {
      drawingTools.polygonDrawing.disableEdit();
      cesiumViewer.deactivateCurrentMapTool();
    }
  };

  const onClickEnableEdit = (data) => {
    if (!viewer || !drawingTools || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!drawingTools.polygonDrawing.isActive()) {
      drawingTool.disableEdit();
      cesiumViewer.deactivateCurrentMapTool();
      drawingTools.activatePolygonDrawing();
    }

    setSelectedName(data._name);
    setSelectedId(data._id);
    drawingTool.enableEditPolygon(data._id);
  };

  const onClickImportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const wktArray = wktString.split(/\r?\n/);
    drawingTools?.importWkt(wktArray, [], ['test label'], undefined, undefined, deleteOption);
    // if (polygons) setImportedPolygons(polygons);
  };

  const onToggleImportWkt = () => {
    for (let i = 0; i < polygons.length; i++) {
      polygons[i].toggleVisibility();
    }
  };

  const onClickExportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const idArray = idString.replace(' ', '').split(',');

    console.info(drawingTools?.exportWKT(idArray));
  };

  const onToggleVisibility = (featureId) => {
    const polygon = drawingTool?.getPolygonById(featureId);
    if (polygon) {
      polygon.toggleVisibility();
    }
  };

  const onToggleFixLabelSize = (featureId) => {
    const polygon = drawingTool?.getPolygonById(featureId);
    if (polygon) {
      console.info(polygon.id);
      polygon.toggleFixLabelSize();
    }
  };

  const onChangeStylePolygon = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      polygonStyleOptions: {
        fillColor: polygonFillColor,
        strokeColor: polygonStrokeColor,
        strokeThickness: parseFloat(polygonStrokeThickness),
        label: polygonLabel,
        labelColor: polygonLabelColor,
        opacity: parseFloat(polygonOpacity)
      }
    };

    drawingTool.setStyleOptions(styleOptions);
  };

  const onChangeLabelTest = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (polygons.length > 0) {
      polygons.forEach((polygon) => {
        polygon.changeStyle({
          polygonStyleOptions: {
            fillColor: polygonFillColor,
            strokeColor: polygonStrokeColor,
            strokeThickness: parseFloat(polygonStrokeThickness),
            label: polygonLabel,
            labelColor: polygonLabelColor,
            opacity: parseFloat(polygonOpacity)
          }
        });
      });
    }
  };

  const onResetStyleForDrawing = () => {
    if (!drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    drawingTool.resetDrawingStyle();
  };

  const handleChangeLayer = (e) => {
    if (!cesiumViewer || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    setActiveLayer(e.target.value);
    layerTool.setActiveLayer(e.target.value);
  };

  const featureDataFields = [
    { id: 0, title: 'Name', key: 'name' },
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
      <SidebarExpandedDivider />

      <div style={{ padding: '15px 0px' }}>
        <button
          type="button"
          id={id}
          disabled={!isEnableDrawing}
          onClick={() => onClickMultipleDraw()}
        >
          Draw Multiple Polygon
        </button>
        <button
          type="button"
          id={id}
          disabled={!isEnableDrawing}
          onClick={() => onClickSingleDraw()}
        >
          Draw Single Polygon
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickRemove()}
        >
          Remove Polygons
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickDisableEdit()}
        >
          Disable Edit
        </button>
      </div>
      <SidebarExpandedDivider />
      <FormGroup style={{ alignItems: 'center' }}>
        <FormControlLabel
          control={<Checkbox checked={clampToGround} onChange={onToggleClampToGround} />}
          label="Clamed To Ground"
        />
      </FormGroup>
      <SidebarExpandedDivider />
      <div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickImportWkt()}
        >
          Import WKT
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onToggleImportWkt()}
        >
          Toggle Imported Polygon
        </button>
        <p>Input WKT strings</p>
        <textarea
          rows={5}
          style={{ width: 250 }}
          onChange={(e) => setWktString(e.target.value)}
          value={wktString}
        />
      </div>
      <SidebarExpandedDivider />
      <div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickExportWkt()}
        >
          Export WKT
        </button>
        <p>Input Ids by comma to export</p>
        <textarea
          rows={5}
          style={{ width: 250 }}
          onChange={(e) => setIdString(e.target.value)}
          value={idString}
        />
      </div>
      <SidebarExpandedDivider />
      <div style={{ paddingTop: 15 }}>
        <p>List of polygons({polygons.length})</p>
        <div style={{ display: 'flex', padding: 12, justifyContent: 'space-between' }}>
          <p>Selected polygon: {selectedName}</p>
        </div>
        <div>
          {polygons.length > 0 && (
            <FeatureTable
              data={polygons}
              fields={featureDataFields}
              onEditFeature={(data) => onClickEnableEdit(data)}
              onDisableFeature={() => onClickDisableEdit()}
              onDeleteSelectedFeature={(data) => {
                // setSelectedName(data._name);
                // setSelectedId(data._id);
                if (!drawingTools) return;
                if (drawingTools.polygonDrawing.deleteOption) {
                  drawingTools.polygonDrawing.deleteOption = deleteOption;
                }
                drawingTools.deletePolygon(data._id);
              }}
              onExportWKT={(featureId) => {
                console.info(drawingTools?.exportWKT([featureId]));
              }}
              onToggleVisibility={(featureId) => onToggleVisibility(featureId)}
              onToggleFixLabelSize={(featureId) => onToggleFixLabelSize(featureId)}
            />
          )}
        </div>
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change polygon style</p>
        <div className="flex-space-between">
          <p>Fill Color:</p>
          <div className="flex-align-center">
            <div
              id="polygon_fill_color"
              style={{
                backgroundColor: polygonFillColor,
                width: 30,
                height: 30,
                borderRadius: 5,
                cursor: 'pointer'
              }}
              onClick={togglePopover}
              role="presentation"
            />
            <Switch
              checked={toggleFillColor}
              size="small"
              onChange={() => {
                setToggleFillColor(!toggleFillColor);
              }}
            />
          </div>
        </div>
        <div className="flex-space-between">
          <p>Stroke color:</p>
          <div>
            <div
              id="polygon_stroke_color"
              style={{
                backgroundColor: polygonFillColor,
                width: 26,
                height: 26,
                borderRadius: 5,
                border: `2px solid ${polygonStrokeColor}`,
                cursor: 'pointer'
              }}
              onClick={togglePopover}
              role="presentation"
            />
          </div>
        </div>
        <p>Stroke Thickness:</p>
        <div className="flex-space-between">
          <Slider
            size="small"
            min={0}
            max={10}
            step={1}
            defaultValue={2}
            aria-label="Small"
            valueLabelDisplay="auto"
            value={parseFloat(polygonStrokeThickness)}
            onChange={(event, value) => setPolygonStrokeThickness(value.toString())}
          />
        </div>
        <div className="flex-space-between">
          <p>Label:</p>
          <input
            type="text"
            value={polygonLabel}
            onChange={(e) => setPolygonLabel(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Label Color:</p>
          <div>
            <div
              id="polygon_label_color"
              style={{
                backgroundColor: polygonLabelColor,
                width: 30,
                height: 30,
                borderRadius: 5,
                cursor: 'pointer'
              }}
              onClick={togglePopover}
              role="presentation"
            />
          </div>
        </div>
        <p>Opacity:</p>
        <div className="flex-space-between">
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            defaultValue={2}
            aria-label="Small"
            valueLabelDisplay="auto"
            value={parseFloat(polygonOpacity)}
            onChange={(event, value) => setPolygonOpacity(value.toString())}
          />
        </div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeStylePolygon()}
        >
          Change
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeLabelTest()}
        >
          Change Label
        </button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onResetStyleForDrawing()}
        >
          Reset
        </button>
      </div>
      <Popover
        open={openColorPicker}
        anchorEl={anchor}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center'
        }}
      >
        <Box display="flex" padding="5px 5px" alignItems="center">
          <Box flexGrow={1}>
            <p style={{ fontSize: 12 }}>Color Picker</p>
          </Box>
          <Box>
            <AiOutlineClose onClick={onCloseColorPicker} />
          </Box>
        </Box>
        <SketchPicker color={pickedColor} onChange={handleColorChange} />
      </Popover>
    </div>
  );
};

export default PolygonDrawingTool;
