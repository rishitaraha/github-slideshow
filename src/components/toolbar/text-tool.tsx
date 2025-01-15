/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Popover,
  Select,
  Slider,
  TextField
} from '@mui/material';
import logger from 'loglevel';
import { CesiumLayer, Textbox } from '@aus-platform/cesium';
import { AiOutlineClose } from 'react-icons/ai';
import { SketchPicker } from 'react-color';
import { TextToolProps } from './types';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import FeatureTable from '../common/feature-table';

const TextTool = ({ id, enabled, viewer }: TextToolProps) => {
  const [isEnableDrawing] = useState(true);
  const [isOpenModal, setIsOpenModal] = useState(false);
  const [text, setText] = useState('');
  const [fontColor, setFontColor] = useState('#000000');
  const [fontSize, setFontSize] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('#000000');
  const [opacity, setOpacity] = useState('1');
  // const [idString, setIdString] = useState('');
  const [wktJSON, setWktJSON] = useState('');
  const [textboxes, setTextboxes] = useState<Textbox[]>([]);
  const cesiumViewer = viewer.viewer;
  const textTool = cesiumViewer?.textTool;
  const textDrawTool = cesiumViewer?.textTool.textDraw;
  const layerTool = cesiumViewer?.layerTool;
  const [textboxFontColor, setTextboxFontColor] = useState('#000000');
  const [textboxFontSize, setTextboxFontSize] = useState('');
  const [textboxBackgroundColor, setTextboxBackgroundColor] = useState('#000000');
  const [textboxOpacity, setTextboxOpacity] = useState('1');
  const [layersList, setLayersList] = useState<CesiumLayer[]>([]);
  const [activeLayer, setActiveLayer] = useState('');
  const [anchor, setAnchor] = useState<any>(null);
  const [openColorPicker, setOpenColorPicker] = useState(false);
  const [pickedColor, setPickedColor] = useState('#000000');

  const togglePopover = (event) => {
    setAnchor(event.currentTarget);
    setOpenColorPicker(true);
  };

  const handleColorChange = (color) => {
    setPickedColor(color);

    if (!anchor) return;
    if (anchor.id === 'text_font_color') {
      setFontColor(color.hex);
    }
    if (anchor.id === 'text_bg_color') {
      setBackgroundColor(color.hex);
    }
    if (anchor.id === 'text_draw_color') {
      setTextboxFontColor(color.hex);
    }
    if (anchor.id === 'text_draw_bg_color') {
      setTextboxBackgroundColor(color.hex);
    }
  };

  const onCloseColorPicker = () => {
    setOpenColorPicker(false);
  };

  const listenerReadyTextDraw = () => {
    console.info('text drawing ready');
    setIsOpenModal(true);
  };

  const listenerCreatedTextDraw = () => {
    console.info('textbox created');
    setTextboxes([...textDrawTool!.textboxes]);
    setIsOpenModal(false);
  };

  const listenerDeletedTextDraw = () => {
    console.info('textbox deleted');
    setTextboxes([...textDrawTool!.textboxes]);
  };

  const listenerDeletedAllTextDraw = () => {
    console.info('textbox all deleted');
    setTextboxes([...textDrawTool!.textboxes]);
  };

  const listenerActiveLayerChanged = () => {
    console.info('Active Layer Changed');
    setActiveLayer(layerTool!.activeLayer!.id);
  };

  const onClick = () => {
    if (!viewer || !textTool || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!layerTool || !layerTool.activeLayer) {
      alert('Please select a layer to draw');
      return;
    }

    if (!textDrawTool.styleOptions) {
      textTool.activateTextDraw(
        undefined,
        {
          textboxStyleOptions: {
            fontColor: '#FF0000',
            backgroundColor: '#00FF00',
            fontSize: 12,
            opacity: 0.7
          }
        },
        { canDelete: true },
        { canSelect: true }
      );
    } else {
      textTool.activateTextDraw();
    }
  };

  const onDeactivate = () => {
    if (!viewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.eventReadyTextboxDraw.removeEventListener(listenerReadyTextDraw);

    cesiumViewer.deactivateCurrentMapTool();
  };

  const handleCloseModal = () => {
    setIsOpenModal(false);
  };

  const handleAddTextbox = () => {
    if (!viewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }
    if (text) textDrawTool.createTextbox(text);
  };

  const onEnableEdit = () => {
    if (!viewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.enableEdit();
  };

  const onDisableEdit = () => {
    if (!viewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.disableEdit();
  };

  const onChangeTextStyle = () => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      textboxStyleOptions: {
        backgroundColor: backgroundColor,
        fontColor: fontColor,
        fontSize: parseFloat(fontSize),
        opacity: parseFloat(opacity)
      }
    };

    textDrawTool.changeStyle(styleOptions);
  };

  const onResetStyleForDrawing = () => {
    if (!textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.resetDrawingStyle();
  };

  const onReset = () => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.resetStyle();
  };

  // const onExportWkt = () => {
  //   if (!cesiumViewer || !textDrawTool) {
  //     logger.error('Viewer is being loaded');
  //     return;
  //   }

  //   textTool?.exportWKT([idString]);
  // };

  const onImportWkt = () => {
    const jsonData = JSON.parse(wktJSON);
    textTool?.importWkt([jsonData]);
  };

  const onToggleVisibility = (featureId) => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textTool?.toggleVisibility(featureId);
  };

  const onClickRemove = (featureId) => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.deleteTextBox(featureId);
  };

  const onClickRemoveAll = () => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    textDrawTool.deleteAllTextBox();
  };

  const onChangeStyleTextbox = () => {
    if (!cesiumViewer || !textDrawTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      textboxStyleOptions: {
        fontColor: textboxFontColor,
        fontSize: parseFloat(textboxFontSize),
        backgroundColor: textboxBackgroundColor,
        opacity: parseFloat(textboxOpacity)
      }
    };

    textDrawTool.setStyleOptions(styleOptions);
  };

  const handleChangeLayer = (e) => {
    if (!cesiumViewer || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    setActiveLayer(e.target.value);
    layerTool.setActiveLayer(e.target.value);
  };

  useEffect(() => {
    if (!cesiumViewer || !textDrawTool || !layerTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    setTextboxes(textDrawTool?.textboxes);
    setLayersList(layerTool.layers);

    if (layerTool.activeLayer) {
      setActiveLayer(layerTool.activeLayer.id);
    }
  }, [textDrawTool?.textboxes]);

  useEffect(() => {
    if (!textDrawTool || !layerTool) return;

    textDrawTool.eventReadyTextboxDraw.addEventListener(listenerReadyTextDraw);
    textDrawTool.eventCreatedTextboxDraw.addEventListener(listenerCreatedTextDraw);
    textDrawTool.eventDeletedTextboxDraw.addEventListener(listenerDeletedTextDraw);
    textDrawTool.eventDeletedAllTextboxDraw.addEventListener(listenerDeletedAllTextDraw);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);

    return () => {
      textDrawTool.eventReadyTextboxDraw.removeEventListener(listenerReadyTextDraw);
      textDrawTool.eventCreatedTextboxDraw.removeEventListener(listenerCreatedTextDraw);
      textDrawTool.eventDeletedTextboxDraw.removeEventListener(listenerDeletedTextDraw);
      textDrawTool.eventDeletedAllTextboxDraw.removeEventListener(listenerDeletedAllTextDraw);
      layerTool.eventActiveLayerChanged.removeEventListener(listenerActiveLayerChanged);
    };
  });

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
        <button type="button" id={id} disabled={!isEnableDrawing} onClick={() => onClick()}>
          Draw Text
        </button>
        <button type="button" id={id} onClick={() => onDeactivate()}>
          Disable Tool
        </button>
        <button type="button" id={id} onClick={() => onEnableEdit()}>
          Enable Edit
        </button>
        <button type="button" id={id} onClick={() => onDisableEdit()}>
          Disable Edit
        </button>
        <button type="button" onClick={() => onClickRemoveAll()}>
          Remove All
        </button>
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change Text style</p>
        <div className="flex-space-between">
          <p>Font Color:</p>
          <div>
            <div
              id="text_font_color"
              style={{
                backgroundColor: fontColor,
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
        <div className="flex-space-between">
          <p>Font Size:</p>
          <input type="text" value={fontSize} onChange={(e) => setFontSize(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>BackgroundColor:</p>
          <div>
            <div
              id="text_bg_color"
              style={{
                backgroundColor: backgroundColor,
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
        <div className="flex-space-between">
          <p>Opacity:</p>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            aria-label="Small"
            valueLabelDisplay="auto"
            value={parseFloat(opacity)}
            onChange={(event, value) => setOpacity(value.toString())}
          />
        </div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeTextStyle()}
        >
          Change
        </button>
      </div>
      <SidebarExpandedDivider />
      <button
        type="button"
        style={{ marginLeft: 10 }}
        id={id}
        disabled={!enabled}
        onClick={() => onReset()}
      >
        Reset
      </button>
      <SidebarExpandedDivider />
      <div>
        {textboxes.length > 0 && (
          <FeatureTable
            data={textboxes}
            fields={featureDataFields}
            onExportWKT={(featureId) => {
              console.info(textTool?.exportWKT([featureId]));
            }}
            onToggleVisibility={(featureId) => {
              onToggleVisibility(featureId);
            }}
            onDeleteSelectedFeature={(data) => onClickRemove(data.id)}
          />
        )}
      </div>
      <SidebarExpandedDivider />
      <textarea value={wktJSON} onChange={(e) => setWktJSON(e.target.value)} />
      <button
        type="button"
        style={{ marginLeft: 10 }}
        id={id}
        disabled={!enabled}
        onClick={() => onImportWkt()}
      >
        Import WKT
      </button>
      <SidebarExpandedDivider />
      <div>
        <p>Change textbox style</p>
        <div className="flex-space-between">
          <p>Font color string:</p>
          <div>
            <div
              id="text_draw_color"
              style={{
                backgroundColor: textboxFontColor,
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
        <div className="flex-space-between">
          <p>Font size</p>
          <input
            type="text"
            value={textboxFontSize}
            onChange={(e) => setTextboxFontSize(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Background color</p>
          <div>
            <div
              id="text_draw_bg_color"
              style={{
                backgroundColor: textboxBackgroundColor,
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
        <div className="flex-space-between">
          <p>Opacity</p>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            defaultValue={1}
            aria-label="Small"
            valueLabelDisplay="auto"
            value={parseFloat(textboxOpacity)}
            onChange={(event, value) => setTextboxOpacity(value.toString())}
          />
        </div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeStyleTextbox()}
        >
          Change
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
      <SidebarExpandedDivider />
      <Dialog open={isOpenModal} onClose={handleCloseModal}>
        <DialogTitle>Add Textbox</DialogTitle>
        <DialogContent style={{ width: 400 }}>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Enter Text"
            type="text"
            fullWidth
            variant="standard"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button onClick={handleAddTextbox}>Add Textbox</Button>
        </DialogActions>
      </Dialog>
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

export default TextTool;
