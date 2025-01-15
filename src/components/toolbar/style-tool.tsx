import React, { useState } from 'react';
import logger from 'loglevel';
import { StyleToolProps } from './types';
import { SidebarExpandedDivider } from '../sidebar/sidebar-styles';

const StyleTool = ({ id, enabled, viewer }: StyleToolProps) => {
  const [featureIds, setFeatureIds] = useState('');
  const [pointColor, setPointColor] = useState('');
  const [pointLabel, setPointLabel] = useState('');
  const [pointOpacity, setPointOpacity] = useState('');
  const [lineStrokeColor, setLineStrokeColor] = useState('');
  const [lineStrokeThickness, setLineStrokeThickness] = useState('');
  const [lineLabel, setLineLabel] = useState('');
  const [lineOpacity, setLineOpacity] = useState('');
  const [polygonFillColor, setPolygonFillColor] = useState('');
  const [polygonStrokeColor, setPolygonStrokeColor] = useState('');
  const [polygonStrokeThickness, setPolygonStrokeThickness] = useState('');
  const [polygonLabel, setPolygonLabel] = useState('');
  const [polygonOpacity, setPolygonOpacity] = useState('');
  const [textboxFontColor, setTextboxFontColor] = useState('');
  const [textboxFontSize, setTextboxFontSize] = useState('');
  const [textboxBackgroundColor, setTextboxBackgroundColor] = useState('');
  const [textboxOpacity, setTextboxOpacity] = useState('');

  const cesiumViewer = viewer.viewer;
  const styleTool = cesiumViewer?.styleTools.styleFeature;

  const onChangeStylePoint = () => {
    if (!cesiumViewer || !styleTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      pointStyleOptions: {
        color: pointColor,
        label: pointLabel,
        opacity: parseFloat(pointOpacity)
      }
    };

    const ids = featureIds.split(',');
    for (let index = 0; index < ids.length; index++) {
      styleTool.changeFeatureStyle(ids[index], styleOptions);
    }
  };

  const onChangeStyleLine = () => {
    if (!cesiumViewer || !styleTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      lineStyleOptions: {
        strokeColor: lineStrokeColor,
        strokeThickness: parseFloat(lineStrokeThickness),
        label: lineLabel,
        opacity: parseFloat(lineOpacity)
      }
    };

    const ids = featureIds.split(',');
    for (let index = 0; index < ids.length; index++) {
      styleTool.changeFeatureStyle(ids[index], styleOptions);
    }
  };

  const onChangeStylePolygon = () => {
    if (!cesiumViewer || !styleTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const styleOptions = {
      polygonStyleOptions: {
        fillColor: polygonFillColor,
        strokeColor: polygonStrokeColor,
        strokeThickness: parseFloat(polygonStrokeThickness),
        label: polygonLabel,
        opacity: parseFloat(polygonOpacity)
      }
    };

    const ids = featureIds.split(',');
    for (let index = 0; index < ids.length; index++) {
      styleTool.changeFeatureStyle(ids[index], styleOptions);
    }
  };

  const onChangeStyleTextbox = () => {
    if (!cesiumViewer || !styleTool) {
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

    const ids = featureIds.split(',');
    for (let index = 0; index < ids.length; index++) {
      styleTool.changeFeatureStyle(ids[index], styleOptions);
    }
  };

  const onReset = () => {
    if (!cesiumViewer || !styleTool) {
      logger.error('Viewer is being loaded');
      return;
    }

    const ids = featureIds.split(',');
    for (let index = 0; index < ids.length; index++) {
      styleTool.resetFeatureStyle(ids[index]);
    }
  };

  return (
    <div>
      <SidebarExpandedDivider />
      <div>
        <p>Feature Ids to change style</p>
        <textarea
          style={{ width: '90%', marginBottom: 15 }}
          rows={10}
          value={featureIds}
          onChange={(e) => {
            setFeatureIds(e.target.value);
          }}
        />
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change point style</p>
        <div className="flex-space-between">
          <p>Color string:</p>
          <input type="text" value={pointColor} onChange={(e) => setPointColor(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>Point Label:</p>
          <input type="text" value={pointLabel} onChange={(e) => setPointLabel(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>Opacity:</p>
          <input
            type="text"
            value={pointOpacity}
            onChange={(e) => setPointOpacity(e.target.value)}
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
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change line style</p>
        <div className="flex-space-between">
          <p>Stroke Color:</p>
          <input
            type="text"
            value={lineStrokeColor}
            onChange={(e) => setLineStrokeColor(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Stroke Thickness:</p>
          <input
            type="text"
            value={lineStrokeThickness}
            onChange={(e) => setLineStrokeThickness(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Line Label:</p>
          <input type="text" value={lineLabel} onChange={(e) => setLineLabel(e.target.value)} />
        </div>
        <div className="flex-space-between">
          <p>Opacity:</p>
          <input type="text" value={lineOpacity} onChange={(e) => setLineOpacity(e.target.value)} />
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
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change polygon style</p>
        <div className="flex-space-between">
          <p>Fill Color string:</p>
          <input
            type="text"
            value={polygonFillColor}
            onChange={(e) => setPolygonFillColor(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Stroke color:</p>
          <input
            type="text"
            value={polygonStrokeColor}
            onChange={(e) => setPolygonStrokeColor(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Stroke Thickness:</p>
          <input
            type="text"
            value={polygonStrokeThickness}
            onChange={(e) => setPolygonStrokeThickness(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Polygon Label:</p>
          <input
            type="text"
            value={polygonLabel}
            onChange={(e) => setPolygonLabel(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Opacity:</p>
          <input
            type="text"
            value={polygonOpacity}
            onChange={(e) => setPolygonOpacity(e.target.value)}
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
      </div>
      <SidebarExpandedDivider />
      <div>
        <p>Change textbox style</p>
        <div className="flex-space-between">
          <p>Font color string:</p>
          <input
            type="text"
            value={textboxFontColor}
            onChange={(e) => setTextboxFontColor(e.target.value)}
          />
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
          <input
            type="text"
            value={textboxBackgroundColor}
            onChange={(e) => setTextboxBackgroundColor(e.target.value)}
          />
        </div>
        <div className="flex-space-between">
          <p>Opacity</p>
          <input
            type="text"
            value={textboxOpacity}
            onChange={(e) => setTextboxOpacity(e.target.value)}
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
    </div>
  );
};

export default StyleTool;
