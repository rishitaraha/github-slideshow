/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import { CesiumLayer, DrawingMode, Line } from '@aus-platform/cesium';
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
import FeatureTable from '../common/feature-table';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import { LineDrawingToolProps } from './types';

const LineDrawingTool = ({ id, enabled, viewer }: LineDrawingToolProps) => {
  const [lines, setLines] = useState<Line[]>([]);
  const [selectedName, setSelectedName] = useState('');
  // const [selectedId, setSelectedId] = useState('');
  const [wktString, setWktString] = useState('');
  const [idString, setIdString] = useState('');
  const [isEnableDrawing, setIsEnableDrawing] = useState(true);
  const [lineStrokeColor, setLineStrokeColor] = useState('#000000');
  const [lineStrokeThickness, setLineStrokeThickness] = useState('2');
  const [lineLabel, setLineLabel] = useState('');
  const [lineLabelColor, setLineLabelColor] = useState('#000000');
  const [lineOpacity, setLineOpacity] = useState('1');
  const [layersList, setLayersList] = useState<CesiumLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const [anchor, setAnchor] = useState<any>(null);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState('#000000');
  const [clampToGround, setClampToGround] = useState(true);

  const togglePopover = (event) => {
    setAnchor(event.currentTarget);
    setOpenColorPicker(true);
  };

  const handleColorChange = (color) => {
    setPickedColor(color);

    if (!anchor) return;
    if (anchor.id === 'line_label_color') {
      setLineLabelColor(color.hex);
    }
    if (anchor.id === 'line_stroke_color') {
      setLineStrokeColor(color.hex);
    }
  };

  const onCloseColorPicker = () => {
    setOpenColorPicker(false);
  };

  const cesiumViewer = viewer.viewer;

  const drawingTools = cesiumViewer?.drawingTools.lineDrawingTools;
  const drawingTool = drawingTools?.lineDrawing;
  const layerTool = cesiumViewer?.layerTool;

  const listenerVertexCreated = () => {
    console.info('VertexCreatedWhileDrawing event triggered!');
  };
  const listenerLineCreated = () => {
    console.info('LineCreated event triggered!');
    setLines([...drawingTool!.lines]);
  };
  const listenerVertexModified = () => {
    console.info('VertexModifiedInLine event triggered!');
  };
  const listenerVertexAdded = () => {
    console.info('VertexAddedInLine event triggered!');
  };
  const listenerVertexDeleted = () => {
    console.info('VertexDeleted event triggered!');
  };
  const listenerLineDeleted = () => {
    console.info('LineDeleted event triggered!');
  };

  const listnerLineDrawingStarted = () => {
    console.info('Line drawing started');
    setIsEnableDrawing(false);
  };
  const listnerLineDrawingEnd = () => {
    console.info('Line drawing started');
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

    if (!layerTool || !layerTool.activeLayer) {
      alert('Please select a layer to draw');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    drawingTools.activateLineDrawing({}, {}, { canDelete: true }, { canSelect: true });
    drawingTool.enableMultipleDrawing();
  };

  const onClickSingleDraw = () => {
    if (!viewer || !drawingTools || !drawingTool || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!layerTool || !layerTool.activeLayer) {
      alert('Please select a layer to draw');
      return;
    }

    cesiumViewer.deactivateCurrentMapTool();
    if (!drawingTool.styleOptions) {
      drawingTools.activateLineDrawing(
        undefined,
        {
          lineStyleOptions: {
            strokeColor: '#00FF00',
            strokeThickness: 5,
            label: 'line-label1',
            opacity: 0.7
          }
        },
        { canDelete: true },
        { canSelect: true }
      );
    } else {
      drawingTools.activateLineDrawing();
    }
    drawingTool.enableSingleDrawing();
  };

  const onClickRemove = () => {
    if (!viewer || !drawingTools || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!drawingTool.isActive()) {
      cesiumViewer.deactivateCurrentMapTool();
      drawingTools.activateLineDrawing();
    }

    drawingTools.deleteAllLines();
    cesiumViewer.deactivateCurrentMapTool();
  };

  const onClickDisableEdit = () => {
    if (!viewer || !drawingTool || !drawingTools) {
      logger.error('Viewer is being loaded');
      return;
    }
    if (drawingTool.isActive()) {
      drawingTool.disableEdit();
      cesiumViewer.deactivateCurrentMapTool();
    }
  };

  const onClickEnableEdit = (data) => {
    if (!viewer || !drawingTool || !drawingTools) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!drawingTool.isActive()) {
      drawingTool.disableEdit();
      cesiumViewer.deactivateCurrentMapTool();
      drawingTools.activateLineDrawing();
    }

    setSelectedName(data._name);
    // setSelectedId(data._id);
    drawingTool.enableEditLine(data._id);
  };

  const onClickImportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const wktArray = wktString.split(/\r?\n/);
    const importedLines = drawingTools?.importWkt(wktArray, [], ['test label']);
    console.info(importedLines);
  };

  const onClickExportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const idArray = idString.replace(' ', '').split(',');

    console.info(drawingTools?.exportWKT(idArray));
  };

  const onToggleVisibility = (featureId) => {
    const line = drawingTool?.getLineById(featureId);
    if (line) {
      line.toggleVisibility();
    }
  };

  const onChangeStyleLine = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      lineStyleOptions: {
        strokeColor: lineStrokeColor,
        strokeThickness: parseFloat(lineStrokeThickness),
        label: lineLabel,
        labelColor: lineLabelColor,
        opacity: parseFloat(lineOpacity)
      }
    };

    drawingTool.setStyleOptions(styleOptions);
  };

  const onChangeLabelTest = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (lines.length > 0) {
      lines.forEach((line) => {
        line.changeStyle({
          lineStyleOptions: {
            strokeColor: lineStrokeColor,
            strokeThickness: parseFloat(lineStrokeThickness),
            label: lineLabel,
            labelColor: lineLabelColor,
            opacity: parseFloat(lineOpacity)
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

    setLines(drawingTool!.lines);
    setLayersList(layerTool.layers);

    if (layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }

    drawingTool.eventVertexCreatedWhileDrawing.addEventListener(listenerVertexCreated);
    drawingTool.eventLineCreated.addEventListener(listenerLineCreated);
    drawingTool.eventVertexModifiedInLine.addEventListener(listenerVertexModified);
    drawingTool.eventVertexAddedInLine.addEventListener(listenerVertexAdded);
    drawingTool.eventVertexDeletedInLine.addEventListener(listenerVertexDeleted);
    drawingTool.eventLineDeleted.addEventListener(listenerLineDeleted);
    drawingTool.eventLineDrawingStarted.addEventListener(listnerLineDrawingStarted);
    drawingTool.eventLineDrawingEnd.addEventListener(listnerLineDrawingEnd);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);

    return () => {
      drawingTool.eventVertexCreatedWhileDrawing.removeEventListener(listenerVertexCreated);
      drawingTool.eventLineCreated.removeEventListener(listenerLineCreated);
      drawingTool.eventVertexModifiedInLine.removeEventListener(listenerVertexModified);
      drawingTool.eventVertexAddedInLine.removeEventListener(listenerVertexAdded);
      drawingTool.eventVertexDeletedInLine.removeEventListener(listenerVertexDeleted);
      drawingTool.eventLineDeleted.removeEventListener(listenerLineDeleted);
      drawingTool.eventLineDrawingStarted.removeEventListener(listnerLineDrawingStarted);
      drawingTool.eventLineDrawingEnd.removeEventListener(listnerLineDrawingEnd);
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
      <div>
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!isEnableDrawing}
          onClick={() => onClickMultipleDraw()}
        >
          Draw Multiple Line
        </button>

        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!isEnableDrawing}
          onClick={() => onClickSingleDraw()}
        >
          Draw Single Line
        </button>
        <button
          type="button"
          style={{ marginTop: 10, marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickRemove()}
        >
          Remove Lines
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
          control={
            <Checkbox
              checked={clampToGround}
              onChange={onToggleClampToGround}
              inputProps={{ 'aria-label': 'controlled' }}
            />
          }
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
        <p>List of lines({lines.length})</p>
        <div style={{ display: 'flex', padding: 12, justifyContent: 'space-between' }}>
          <p>Selected line: {selectedName}</p>
        </div>
        <div>
          {lines.length > 0 && (
            <FeatureTable
              data={lines}
              fields={featureDataFields}
              onEditFeature={(data) => onClickEnableEdit(data)}
              onDisableFeature={() => onClickDisableEdit()}
              onDeleteSelectedFeature={(data) => {
                // setSelectedName(data._name);
                // setSelectedId(data._id);
                drawingTools?.deleteLine(data._id);
              }}
              onExportWKT={(featureId) => {
                console.info(drawingTools?.exportWKT([featureId]));
              }}
              onToggleVisibility={(featureId) => onToggleVisibility(featureId)}
            />
          )}
        </div>
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change line style</p>
        <div className="flex-space-between">
          <p>Stroke Color:</p>
          <div>
            <div
              id="line_stroke_color"
              style={{
                width: 26,
                height: 26,
                borderRadius: 5,
                border: `2px solid ${lineStrokeColor}`,
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
            value={parseFloat(lineStrokeThickness)}
            onChange={(event, value) => setLineStrokeThickness(value.toString())}
          />
        </div>
        <div className="flex-space-between">
          <p>Label:</p>
          <input type="text" value={lineLabel} onChange={(e) => setLineLabel(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>Label Color:</p>
          <div>
            <div
              id="line_label_color"
              style={{
                backgroundColor: lineLabelColor,
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
            value={parseFloat(lineOpacity)}
            onChange={(event, value) => setLineOpacity(value.toString())}
          />
        </div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeStyleLine()}
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

export default LineDrawingTool;
