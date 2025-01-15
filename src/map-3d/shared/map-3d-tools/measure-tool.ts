import { Line, Polygon } from '@aus-platform/cesium';
import { degreesToRadians, area as getArea } from '@turf/turf';
import { Cartesian3, Math as CesiumMath, Ellipsoid } from 'cesium';
import { isNil, isUndefined, size } from 'lodash';
import { IInfoTool } from './action-tools/info-tool';
import { ILineTool, IPolygonTool, Lines, Polygons } from './drawing-tools';
import { IMeasureTool } from './interfaces';

export class MeasureTool implements IMeasureTool {
  private _infoTool: IInfoTool;
  private _lineTool: ILineTool;
  private _polygonTool: IPolygonTool;

  private _currentDrawnPolygons: Polygons = {};

  private _currentDrawnLines: Lines = {};

  private _isPolygonDrawingStarted = false;
  private _isLineDrawingStarted = false;

  constructor(
    infoTool: IInfoTool,
    lineTool: ILineTool,
    polygonTool: IPolygonTool,
  ) {
    this._infoTool = infoTool;
    this._lineTool = lineTool;
    this._polygonTool = polygonTool;

    // Capture start and end drawing.
    this.eventDrawingStarted();
  }

  // Deactivate Measure Tool.
  deactivateMeasureTool() {
    this.eventRemoveModifyGeometry();
    this.deleteAllCurrentDrawnGeometries();
    this.deactivateLineDrawing();
    this.deactivatePolygonDrawing();

    this.lineTool.deactivate();
    this.polygonTool.deactivate();
    this._infoTool.deactivate();
  }

  // Activate drawing.
  activatePolygonDrawing() {
    this._polygonTool.activate({ measurementTool: true }, {}, true, false);
  }

  activateLineDrawing() {
    this._lineTool.activate({ measurementTool: true }, {}, true, false);
  }

  activateInfoTool() {
    this._lineTool.deactivate();
    this._polygonTool.deactivate();
    this._infoTool.activate();
  }

  // Deactivate drawing.
  deactivatePolygonDrawing() {
    this.polygonTool.polygonTool.polygonDrawing.eventPolygonDrawingEnd.removeEventListener(
      this.polygonDrawingEnded,
    );
  }

  deactivateLineDrawing() {
    this.lineTool.lineTool.lineDrawing.eventLineDrawingEnd.removeEventListener(
      this.lineDrawingEnded,
    );
  }

  deactivateInfoTool() {
    this._infoTool.deactivate();
  }

  // Updation of geometry.
  updateCurrentPolygon = ([], polygon: Polygon[]) => {
    if (this._currentDrawnPolygons[polygon[0].id]) {
      this._currentDrawnPolygons[polygon[0].id] = polygon[0];
      this.initiatePolygonMeasurement(polygon[0]);
    }
  };

  updateCurrentLine = ([], line: Line[]) => {
    if (this._currentDrawnLines[line[0].id]) {
      this._currentDrawnLines[line[0].id] = line[0];
      this.initiateLineMeasurement(line[0]);
    }
  };

  // Remove current geometry.
  deleteCurrentDrawnPolygon() {
    const currentPolygonId = this.currentPolygon.id;
    this.polygonTool.polygonTool.deletePolygon(currentPolygonId);
    delete this._currentDrawnPolygons[currentPolygonId];
    this._currentDrawnPolygons = {};
  }

  deleteCurrentDrawnLine() {
    const currentLineId = this.currentLine.id;
    this.lineTool.lineTool.deleteLine(currentLineId);
    delete this._currentDrawnLines[currentLineId];
    this._currentDrawnLines = {};
  }

  deleteAllCurrentDrawnGeometries() {
    this.isAnyPolygonDrawn && this.deleteCurrentDrawnPolygon();
    this.isAnyLineDrawn && this.deleteCurrentDrawnLine();
  }

  deleteCurrentlyDrawingPolygon() {
    if (this._isPolygonDrawingStarted) {
      this.polygonTool.polygonTool.polygonDrawing.deleteDash();
      this.polygonTool.polygonTool.polygonDrawing.deletePolygon();
      this.polygonDrawingEnded();
    }
  }

  deleteCurrentlyDrawingLine() {
    if (this._isLineDrawingStarted) {
      this.lineTool.lineTool.lineDrawing.deleteDash();
      this.lineTool.lineTool.lineDrawing.deleteLine();
      this.lineDrawingEnded();
    }
  }

  // Reset.
  resetCurrentDrawing() {
    this.deleteCurrentlyDrawingPolygon();
    this.deleteCurrentlyDrawingLine();
    this.deactivatePolygonDrawing();
    this.deactivateLineDrawing();
  }

  //Events.
  eventDrawingStarted = () => {
    this.polygonTool.polygonTool.polygonDrawing.eventPolygonDrawingStarted.addEventListener(
      this.polygonDrawingStarted,
    );
    this.lineTool.lineTool.lineDrawing.eventLineDrawingStarted.addEventListener(
      this.lineDrawingStarted,
    );
  };

  eventPolygonEditing() {
    // Capture edited polygon.
    this?.polygonTool.polygonTool.polygonDrawing.eventVertexAddedInPolygon.addEventListener(
      this.updateCurrentPolygon,
    );

    this?.polygonTool.polygonTool.polygonDrawing.eventVertexModifiedInPolygon.addEventListener(
      this.updateCurrentPolygon,
    );

    this?.polygonTool.polygonTool.polygonDrawing.eventVertexDeletedInPolygon.addEventListener(
      this.updateCurrentPolygon,
    );
  }

  eventLineEditing() {
    // Capture edited line.
    this?.lineTool.lineTool.lineDrawing.eventVertexAddedInLine.addEventListener(
      this.updateCurrentLine,
    );

    this?.lineTool.lineTool.lineDrawing.eventVertexModifiedInLine.addEventListener(
      this.updateCurrentLine,
    );

    this?.lineTool.lineTool.lineDrawing.eventVertexDeletedInLine.addEventListener(
      this.updateCurrentLine,
    );
  }

  eventRemoveModifyPolygon() {
    // Capture edited polygon.
    this?.polygonTool.polygonTool.polygonDrawing.eventVertexAddedInPolygon.removeEventListener(
      this.updateCurrentPolygon,
    );

    this?.polygonTool.polygonTool.polygonDrawing.eventVertexModifiedInPolygon.removeEventListener(
      this.updateCurrentPolygon,
    );

    this?.polygonTool.polygonTool.polygonDrawing.eventVertexDeletedInPolygon.removeEventListener(
      this.updateCurrentPolygon,
    );
  }

  eventRemoveModifyLine() {
    // Capture edited line.
    this?.lineTool.lineTool.lineDrawing.eventVertexAddedInLine.removeEventListener(
      this.updateCurrentLine,
    );

    this?.lineTool.lineTool.lineDrawing.eventVertexModifiedInLine.removeEventListener(
      this.updateCurrentLine,
    );

    this?.lineTool.lineTool.lineDrawing.eventVertexDeletedInLine.removeEventListener(
      this.updateCurrentLine,
    );
  }

  eventRemoveModifyGeometry = () => {
    this.eventRemoveModifyPolygon();
    this.eventRemoveModifyLine();
  };

  // Listeners.
  polygonDrawingStarted = () => {
    if (!this._isPolygonDrawingStarted) {
      this._isPolygonDrawingStarted = true;
    }
  };

  polygonDrawingEnded = () => {
    if (this._isPolygonDrawingStarted) {
      this._isPolygonDrawingStarted = false;
    }
  };

  lineDrawingStarted = () => {
    if (!this._isLineDrawingStarted) {
      this._isLineDrawingStarted = true;
    }
  };

  lineDrawingEnded = () => {
    if (this._isLineDrawingStarted) {
      this._isLineDrawingStarted = false;
    }
  };

  // Calculations.
  getDistanceBetweenTwoCoordinates(
    position1: Cartesian3,
    position2: Cartesian3,
  ) {
    const earthRadiusInKm = 6371;

    /*
      Converting cartesian coordinates to long lat (in degrees).
      Ref: https://community.cesium.com/t/degrees-from-cartesian-3/3566
    */
    const cartographicCoordinates =
      Ellipsoid.WGS84.cartesianArrayToCartographicArray([position1, position2]); // Coordinates in radians
    const longitude1 = CesiumMath.toDegrees(
      cartographicCoordinates[0].longitude,
    );
    const latitude1 = CesiumMath.toDegrees(cartographicCoordinates[0].latitude);
    const longitude2 = CesiumMath.toDegrees(
      cartographicCoordinates[1].longitude,
    );
    const latitude2 = CesiumMath.toDegrees(cartographicCoordinates[1].latitude);

    /*
      Haversine formula for calculating distance.
      Ref: https://en.wikipedia.org/wiki/Haversine_formula
      implementation: https://stackoverflow.com/questions/365826/calculate-distance-between-2-gps-coordinates
      main source for Implementation: http://www.movable-type.co.uk/scripts/latlong.html
    */
    const latitudeInRadian1 = degreesToRadians(latitude1);
    const latitudeInRadian2 = degreesToRadians(latitude2);

    const distanceLatitude = degreesToRadians(latitude2 - latitude1);
    const distanceLongitude = degreesToRadians(longitude2 - longitude1);

    // a and c here a literally like maths variables. Please check the reference give above to know more.
    const a =
      Math.sin(distanceLatitude / 2) * Math.sin(distanceLatitude / 2) +
      Math.sin(distanceLongitude / 2) *
        Math.sin(distanceLongitude / 2) *
        Math.cos(latitudeInRadian1) *
        Math.cos(latitudeInRadian2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusInKm * c;
  }

  calculateDistance(positions: Cartesian3[]) {
    let distance = 0;
    for (let index = 0; index < positions.length - 1; index++) {
      distance += this.getDistanceBetweenTwoCoordinates(
        positions[index],
        positions[index + 1],
      );
    }
    return distance;
  }

  calculateArea(polygonId: string) {
    let area = 0;
    const polygonGeojson = this.polygonTool.exportPolygonToGeoJSON(polygonId);
    if (!isNil(polygonGeojson)) {
      area = getArea(polygonGeojson);
    }
    return area;
  }

  calculatePerimeter(positions: Cartesian3[]) {
    /*
        Get the distance between all the points + distace between
        first and last point since this is a polygon.
    */
    const perimeter =
      this.calculateDistance(positions) +
      this.getDistanceBetweenTwoCoordinates(
        positions[0],
        positions[positions.length - 1],
      );
    return perimeter;
  }

  // Initiate calculations.
  initiatePolygonMeasurement(polygon: Polygon) {
    const perimeter = this.calculatePerimeter(polygon.positions);

    let perimeterString = '';
    if (perimeter < 1) {
      perimeterString = ` ${(perimeter * 1000).toFixed(2)}m`;
    } else {
      perimeterString = ` ${perimeter.toFixed(2)}km`;
    }

    const area = this.calculateArea(polygon.id);
    let areaString = '';
    if (area < 1000000) {
      areaString = ` ${area.toFixed(2)}m&#x00B2;`;
    } else {
      areaString = ` ${(area / 1000000).toFixed(2)}km&#x00B2;`;
    }

    polygon.changeStyle({
      polygonStyleOptions: {
        fillColor: '#9ACD32',
        label: `area:  ${areaString} | perimeter: ${perimeterString}`,
        opacity: 0.2,
      },
    });
  }

  initiateLineMeasurement(line: Line) {
    const distance = this.calculateDistance(line.positions);

    let distanceString = '';

    if (distance < 1) {
      distanceString = ` ${(distance * 1000).toFixed(2)}m`;
    } else {
      distanceString = ` ${distance.toFixed(2)}km`;
    }

    line.setLabel(`distance: ${distanceString}`);
  }

  // Getters.
  get currentPolygon() {
    const idArray = Object.keys(this._currentDrawnPolygons);
    const latestPolygonId = idArray[size(idArray) - 1];
    return this._currentDrawnPolygons[latestPolygonId];
  }

  get currentLine() {
    const idArray = Object.keys(this._currentDrawnLines);
    const latestLineId = idArray[size(idArray) - 1];
    return this._currentDrawnLines[latestLineId];
  }

  get isAnyLineDrawn() {
    return Boolean(size(this._currentDrawnLines) > 0);
  }

  get isAnyPolygonDrawn() {
    return Boolean(size(this._currentDrawnPolygons) > 0);
  }

  get drawingIsActive() {
    if (this._isLineDrawingStarted || this._isPolygonDrawingStarted) {
      return true;
    }
    return false;
  }

  get lineTool() {
    return this._lineTool;
  }

  get polygonTool() {
    return this._polygonTool;
  }

  get infoTool() {
    return this._infoTool;
  }

  // Setter.
  setPolygon = (polygon: Polygon) => {
    if (isUndefined(this._currentDrawnPolygons[polygon.id])) {
      this._currentDrawnPolygons[polygon.id] = polygon;
    }
  };

  setLine = (line: Line) => {
    if (isUndefined(this._currentDrawnPolygons[line.id])) {
      this._currentDrawnLines[line.id] = line;
    }
  };
}
