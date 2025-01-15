import React, { useState } from 'react';
import { FeatureCollection } from 'geojson';
import { ExportToWKTorJsonProps, GEOMETRY_TYPE } from './type';

const ExportToWKTorGeoJson = ({ viewer }: ExportToWKTorJsonProps) => {
  const [polygonId, setPolygonId] = useState('');
  const [lineId, setLineId] = useState('');
  const [pointId, setPointId] = useState('');

  /**
   * Download file for exported WKT or JSON.
   */
  // const downloadFile = (fileName: string, content: string) => {
  //   const element = document.createElement('a');
  //   const file = new Blob([content], { type: 'text/plain' });
  //   element.href = URL.createObjectURL(file);
  //   element.download = fileName;
  //   document.body.appendChild(element); // Required for this to work in FireFox
  //   element.click();
  // };

  const onClickExportWKT = () => {
    const wktJson = viewer.exportToWKT();
    console.info(wktJson);

    /* Download exported WKT string. */
    // let wktString = '';

    // if (!wktJson) wktString = '';
    // else wktString = JSON.stringify(wktJson);

    // const fileName = `wkt-${uuidv4()}.txt`;
    // downloadFile(fileName, wktString);
  };

  const onClickExportToGeoJson = (geometryType: GEOMETRY_TYPE) => {
    let geojson: FeatureCollection | undefined;
    let geojsonString: string;

    switch (geometryType) {
      case GEOMETRY_TYPE.POLYGON:
        if (polygonId === '') return;
        geojson = viewer.exportGeometryToGeoJson(polygonId, GEOMETRY_TYPE.POLYGON);
        break;
      case GEOMETRY_TYPE.LINE:
        if (lineId === '') return;
        geojson = viewer.exportGeometryToGeoJson(lineId, GEOMETRY_TYPE.LINE);
        break;
      case GEOMETRY_TYPE.POINT:
        if (pointId === '') return;
        geojson = viewer.exportGeometryToGeoJson(pointId, GEOMETRY_TYPE.POINT);
        break;
      default:
        geojson = viewer.exportToGeoJson();
        break;
    }

    if (!geojson) geojsonString = '';
    else geojsonString = JSON.stringify(geojson);
    console.info(geojsonString);

    // const fileName = `geojson-${uuidv4()}.json`;
    // downloadFile(fileName, geojsonString);
  };

  return (
    <div>
      <button type="button" onClick={() => onClickExportWKT()}>
        Export To WKT String
      </button>
      <button type="button" onClick={() => onClickExportToGeoJson(GEOMETRY_TYPE.NONE)}>
        Export All To GeoJson
      </button>
      <div>
        <button type="button" onClick={() => onClickExportToGeoJson(GEOMETRY_TYPE.POLYGON)}>
          Export Polygon To GeoJson
        </button>
        <input type="text" value={polygonId} onChange={(e) => setPolygonId(e.target.value)} />
      </div>
      <div>
        <button type="button" onClick={() => onClickExportToGeoJson(GEOMETRY_TYPE.LINE)}>
          Export Line To GeoJson
        </button>
        <input type="text" value={lineId} onChange={(e) => setLineId(e.target.value)} />
      </div>
      <div>
        <button type="button" onClick={() => onClickExportToGeoJson(GEOMETRY_TYPE.POINT)}>
          Export Point To GeoJson
        </button>
        <input type="text" value={pointId} onChange={(e) => setPointId(e.target.value)} />
      </div>
    </div>
  );
};

export { ExportToWKTorGeoJson };
