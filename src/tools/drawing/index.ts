import { Viewer } from 'cesium';
import { LineDrawingTools, PointDrawingTools, PolygonDrawingTools } from '..';
import { CesiumViewerType } from '../../types';
import { MeasureTools3D } from './measure-tool-3d/drawing-tools';

export * from './polygon-drawing/drawing-tools';
export * from './line-drawing/drawing-tools';
export * from './point-drawing/drawing-tools';
export * from './drawing-tool-settings';
export * from './enums';
export * from './types';

export class DrawingTools {
  polygonDrawingTools: PolygonDrawingTools;
  lineDrawingTools: LineDrawingTools;
  pointDrawingTools: PointDrawingTools;
  measureTools3D: MeasureTools3D;

  constructor(viewer: Viewer) {
    this.polygonDrawingTools = new PolygonDrawingTools({
      viewer: <CesiumViewerType>viewer,
    });
    this.lineDrawingTools = new LineDrawingTools({
      viewer: <CesiumViewerType>viewer,
    });
    this.pointDrawingTools = new PointDrawingTools({
      viewer: <CesiumViewerType>viewer,
    });
    this.measureTools3D = new MeasureTools3D({
      viewer: <CesiumViewerType>viewer,
    });
  }

  showMarker() {
    this.polygonDrawingTools.polygonDrawing.showMarker();
    this.lineDrawingTools.lineDrawing.showMarker();
    this.pointDrawingTools.pointDrawing.showMarker();
  }

  hideMarker() {
    this.polygonDrawingTools.polygonDrawing.hideMarker();
    this.lineDrawingTools.lineDrawing.hideMarker();
    this.pointDrawingTools.pointDrawing.hideMarker();
  }

  destroy() {
    if (this.polygonDrawingTools) {
      this.polygonDrawingTools.destroy();
    }
    if (this.lineDrawingTools) {
      this.lineDrawingTools.destroy();
    }
    if (this.pointDrawingTools) {
      this.pointDrawingTools.destroy();
    }
  }
}
