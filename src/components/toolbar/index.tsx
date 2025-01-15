import React from 'react';
import PolygonDrawingTool from './polygon-drawing-tool';
import LineDrawingTool from './line-drawing-tool';
import { ToolbarContainer } from './toolbar-styles';
import { ToolbarProps } from './types';
import PointDrawingTool from './point-drawing-tool';

const Toolbar = ({
  toolbarContainerOption,
  polygonDrawingToolOption,
  lineDrawingToolOption,
  pointDrawingToolOption
}: ToolbarProps) => (
  <ToolbarContainer disp={toolbarContainerOption.disp}>
    <PolygonDrawingTool
      id={polygonDrawingToolOption!.id}
      enabled={polygonDrawingToolOption!.enabled}
      viewer={polygonDrawingToolOption!.viewer}
    />
    <LineDrawingTool
      id={lineDrawingToolOption!.id}
      enabled={lineDrawingToolOption!.enabled}
      viewer={polygonDrawingToolOption!.viewer}
    />
    <PointDrawingTool
      id={pointDrawingToolOption!.id}
      enabled={pointDrawingToolOption!.enabled}
      viewer={pointDrawingToolOption!.viewer}
    />
  </ToolbarContainer>
);

export default Toolbar;
