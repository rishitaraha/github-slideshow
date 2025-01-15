/* eslint-disable consistent-return */
import React, { useEffect, useState } from 'react';
import logger from 'loglevel';
import {
  CesiumLayer,
  MAX_ZOOM_LEVEL,
  Point,
  getFeaturesDataFromZipFile,
  getViewportBounds
} from '@aus-platform/cesium';
import { Box, FormControl, InputLabel, MenuItem, Popover, Select, Slider } from '@mui/material';
import { AiOutlineClose } from 'react-icons/ai';
import { SketchPicker } from 'react-color';
import Supercluster from 'supercluster';
import { wktToGeoJSON } from '@terraformer/wkt';
import { GeoJSON } from 'geojson';
import FeatureTable from '../common/feature-table';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';
import { PointDrawingToolProps } from './types';

const superCluster = new Supercluster({ radius: 10, maxZoom: MAX_ZOOM_LEVEL, minZoom: 0 });

const readJsonFile = (file: Blob) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = (event) => {
      if (event.target) {
        resolve(JSON.parse(event.target.result as string));
      }
    };

    fileReader.onerror = (error) => reject(error);
    fileReader.readAsText(file);
  });

const readTextFile = (file: Blob) =>
  new Promise((resolve, reject) => {
    const fileReader = new FileReader();

    fileReader.onload = (event) => {
      if (event.target) {
        if (!event.target.result) return;
        const wktArray = (event.target.result as string).split(/\r?\n/);
        const geoJSON: GeoJSON = {
          type: 'FeatureCollection',
          features: []
        };
        for (let i = 0; i < wktArray.length; i++) {
          try {
            const geoJsonFeature: GeoJSON = {
              type: 'Feature',
              properties: { id: null, NAME: null, LAYER: null, ELEVATION: null },
              geometry: wktToGeoJSON(wktArray[i].replaceAll('"', ''))
            };
            geoJSON.features.push(geoJsonFeature);
          } catch (e) {
            console.error(`parse error - ${i}th point ${wktArray[i]}`);
          }
        }
        resolve(geoJSON);
      }
    };

    fileReader.onerror = (error) => reject(error);
    fileReader.readAsText(file);
  });

const FileInputJson = () => {
  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const parsedData = await readJsonFile(event.target.files[0]);
      // @ts-ignore
      superCluster.load(parsedData.features);
    }
  };

  return <input type="file" accept=".json,application/json" onChange={onChange} />;
};

const FileInputText = ({ viewer }) => {
  const onChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const parsedData = await readTextFile(event.target.files[0]);
      // @ts-ignore
      superCluster.load(parsedData.features);
      try {
        // @ts-ignore
        const targetPoint = parsedData.features[0];
        const targetLocation = targetPoint.geometry.coordinates;
        viewer.flyTo(`${targetLocation[0]}`, `${targetLocation[1]}`);
      } catch (e) {
        console.error('Camera fly to object failed');
      }
    }
  };

  return <input type="file" onChange={onChange} />;
};

const FileInputShape = ({ viewer }) => {
  const onChangeFile = async (event) => {
    const file = event.target.files[0];
    if (file.type === 'application/x-zip-compressed') {
      const result = await getFeaturesDataFromZipFile(file);
      if (result) {
        // @ts-ignore
        superCluster.load(result.features);
        try {
          // @ts-ignore
          const targetPoint = result.features[0];
          const targetLocation = targetPoint.geometry.coordinates;
          viewer.flyTo(`${targetLocation[0]}`, `${targetLocation[1]}`);
        } catch (e) {
          console.error('Camera fly to object failed');
        }
      } else {
        alert('Parse shape file failed!');
      }
    } else {
      alert('Please select a zip file. The files for shape type need to be zip.');
    }
  };

  return (
    <div style={{ paddingBottom: 50 }}>
      <input type="file" onChange={onChangeFile} />
    </div>
  );
};

const PointDrawingTool = ({ id, enabled, viewer }: PointDrawingToolProps) => {
  const [points, setPoints] = useState<Point[]>([]);
  const [wktString, setWktString] = useState('');
  const [idString, setIdString] = useState('');
  const [pointColor, setPointColor] = useState('#000000');
  const [pointLabel, setPointLabel] = useState('');
  const [pointLabelColor, setPointLabelColor] = useState('#000000');
  const [pointOpacity, setPointOpacity] = useState('1');
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
    if (anchor.id === 'point_label_color') {
      setPointLabelColor(color.hex);
    }
    if (anchor.id === 'point_color') {
      setPointColor(color.hex);
    }
  };

  const onCloseColorPicker = () => {
    setOpenColorPicker(false);
  };

  const cesiumViewer = viewer.viewer;

  const drawingTools = cesiumViewer?.drawingTools.pointDrawingTools;
  const drawingTool = drawingTools?.pointDrawing;
  const layerTool = cesiumViewer?.layerTool;

  const listenerPointCreated = () => {
    console.info('PointCreated event triggered!');
    setPoints(drawingTool!.points);
  };

  const listenerPointDeleted = () => {
    console.info('PointDelete event triggered!');
    setPoints(drawingTool!.points);
  };

  const listenerActiveLayerChanged = () => {
    console.info('Active Layer Changed');
    setActiveLayer(layerTool!.activeLayer!.id);
  };

  const listenerCameraMoveEnd = () => {
    if (!cesiumViewer) return;
    const cameraViewBounds = getViewportBounds(cesiumViewer.scene);
    if (!cameraViewBounds) return;
    try {
      drawingTools?.createPointClusters(superCluster, cameraViewBounds);
    } catch (e) {
      console.error(e);
    }
  };

  const listenerPointDragging = (featureId) => {
    console.info(`Point ${featureId} dragging event triggered`);
  };

  const listenerPointReleased = (featureId) => {
    console.info(`Point ${featureId} release event triggered`);
  };

  // Enable drawing tool
  const onClickDraw = () => {
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
      drawingTools.activatePointDrawing(
        undefined,
        {
          pointStyleOptions: {
            label: 'polygon-label1',
            opacity: 0.7,
            color: '#FF00FF'
          }
        },
        { canDelete: true },
        { canSelect: true }
      );
    } else {
      drawingTools.activatePointDrawing();
    }
  };

  const onClickRemove = () => {
    if (!viewer || !drawingTools || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (!drawingTools.pointDrawing.isActive()) {
      cesiumViewer.deactivateCurrentMapTool();
      drawingTools.activatePointDrawing();
    }

    drawingTools.deleteAllPoints();
    cesiumViewer.deactivateCurrentMapTool();
    setPoints(drawingTool.points);
  };

  const onClickImportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const wktArray = wktString.split(/\r?\n/);
    const importedPoints = drawingTools?.importWkt(wktArray, [], ['test label']);
    console.info(importedPoints);
  };

  const onClickImportGeoJSON = () => {
    const clusters = superCluster.getClusters([69.28911, 24.08771, 69.35967, 24.16313], 8);
    console.info(clusters);
  };

  const onClickExportWkt = () => {
    if (!drawingTools) {
      return;
    }

    const idArray = idString.replace(' ', '').split(',');

    console.info(drawingTools?.exportWKT(idArray));
  };

  const onToggleVisibility = (featureId) => {
    const point = drawingTool?.getPointById(featureId);
    if (point) {
      point.toggleVisibility();
    }
  };

  const onChangeStylePoint = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      pointStyleOptions: {
        color: pointColor,
        label: pointLabel,
        labelColor: pointLabelColor,
        opacity: parseFloat(pointOpacity)
      }
    };

    drawingTool.setStyleOptions(styleOptions);
  };

  const onChangeLabelTest = () => {
    if (!cesiumViewer || !drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    if (points.length > 0) {
      points.forEach((point) => {
        point.changeStyle({
          pointStyleOptions: {
            color: pointColor,
            label: pointLabel,
            labelColor: pointLabelColor,
            opacity: parseFloat(pointOpacity)
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

  const onDeletePoint = (featureId) => {
    if (!drawingTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    drawingTools.deletePoint(featureId);
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
    if (!drawingTool || !layerTool) return;

    setPoints(drawingTool.points);
    setLayersList(layerTool.layers);

    drawingTool.eventPointCreated.addEventListener(listenerPointCreated);
    drawingTool.eventPointDeleted.addEventListener(listenerPointDeleted);
    drawingTool.eventPointDragging.addEventListener(listenerPointDragging);
    drawingTool.eventPointReleased.addEventListener(listenerPointReleased);
    layerTool.eventActiveLayerChanged.addEventListener(listenerActiveLayerChanged);
    cesiumViewer.scene.camera.moveEnd.addEventListener(listenerCameraMoveEnd);
    return () => {
      drawingTool.eventPointCreated.removeEventListener(listenerPointCreated);
      drawingTool.eventPointDeleted.removeEventListener(listenerPointDeleted);
      layerTool.eventActiveLayerChanged.removeEventListener(listenerActiveLayerChanged);
      cesiumViewer.scene.camera.moveEnd.removeEventListener(listenerCameraMoveEnd);
    };
  });

  const featureDataFields = [
    { id: 0, title: 'Name', key: 'name' },
    { id: 1, title: 'ID', key: 'id' }
  ];

  const onClickDrawAsShape = () => {
    drawingTool?.drawPointAsShape();
  };

  const onClickDrawAsMarker = () => {
    drawingTool?.drawPointAsMarker();
  };

  const onClickShowAllPointsAsShape = () => {
    drawingTool?.showAllPointsAsShape();
  };

  const onClickShowAllPointsAsMarker = () => {
    drawingTool?.showAllPointsAsMarker();
  };

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
      <button
        type="button"
        style={{ marginTop: 10 }}
        id={id}
        disabled={!enabled}
        onClick={() => onClickDraw()}
      >
        Draw Points
      </button>
      <button
        type="button"
        style={{ marginTop: 10, marginLeft: 10 }}
        id={id}
        disabled={!enabled}
        onClick={() => onClickRemove()}
      >
        Remove Points
      </button>
      <SidebarExpandedDivider />
      <div>
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickDrawAsShape()}
        >
          Draw As Shape
        </button>
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickDrawAsMarker()}
        >
          Draw As Marker
        </button>
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickShowAllPointsAsMarker()}
        >
          Show all points as Marker
        </button>
        <button
          type="button"
          style={{ marginTop: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickShowAllPointsAsShape()}
        >
          Show all points as Shape
        </button>
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
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickImportGeoJSON()}
        >
          Import GeoJSON file
        </button>
        <FileInputJson />
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onClickImportGeoJSON()}
        >
          Import WKT file
        </button>
        <FileInputText viewer={viewer} />
        <p style={{ color: 'red' }}>Import Shape file</p>
        <FileInputShape viewer={viewer} />
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
      <div>
        {points.length > 0 && (
          <FeatureTable
            data={points}
            fields={featureDataFields}
            onExportWKT={(featureId) => {
              console.info(drawingTools?.exportWKT([featureId]));
            }}
            onDeleteSelectedFeature={(data) => {
              onDeletePoint(data.id);
            }}
            onToggleVisibility={(featureId) => onToggleVisibility(featureId)}
          />
        )}
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change point style</p>
        <div className="flex-space-between">
          <p>Color string:</p>
          <div>
            <div
              id="point_color"
              style={{
                backgroundColor: pointColor,
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
          <p>Point Label:</p>
          <input type="text" value={pointLabel} onChange={(e) => setPointLabel(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>Label Color:</p>
          <div>
            <div
              id="point_label_color"
              style={{
                backgroundColor: pointLabelColor,
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
            value={parseFloat(pointOpacity)}
            onChange={(event, value) => setPointOpacity(value.toString())}
          />
        </div>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          id={id}
          disabled={!enabled}
          onClick={() => onChangeStylePoint()}
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

export default PointDrawingTool;
