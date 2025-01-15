import React, { useState } from 'react';
import { ImportWKTorGeoJSONProps } from './type';

const ImportWKTorGeoJSON = ({ viewer }: ImportWKTorGeoJSONProps) => {
  const [wktString, setWktString] = useState('');
  const [geojsonString, setGeojsonString] = useState('');

  const onClickImportWKT = () => {
    // e.preventDefault();
    // const reader = new FileReader();
    // reader.onload = async (e) => {
    //   const text = e.target!.result;
    //   viewer.importWKT(text!.toString());
    //   console.info(text);
    // };
    // reader.readAsText(e.target.files[0]);
    console.info(viewer.importWKT(wktString, undefined, 'label-test'));
  };

  const onClickImportGeoJson = () => {
    // e.preventDefault();
    // const reader = new FileReader();
    // reader.onload = async (e) => {
    //   const text = e.target!.result;
    //   viewer.importGeoJson(text!.toString());
    //   console.info(text);
    // };
    // reader.readAsText(e.target.files[0]);
    console.info(viewer.importGeoJson(geojsonString));
  };
  return (
    <div>
      {/* <p style={{ color: '#FFFFFF', marginTop: 15 }}>Import WKT:</p> */}
      {/* <input type="file" onChange={(e) => onClickImportWKT(e)} accept=".txt" /> */}
      <button type="button" onClick={() => onClickImportWKT()}>
        Import WKT
      </button>
      <textarea
        rows={5}
        style={{ width: 250 }}
        onChange={(e) => setWktString(e.target.value)}
        value={wktString}
      />
      {/* <p style={{ color: '#FFFFFF', marginTop: 5 }}>Import GeoJSON:</p> */}
      {/* <input type="file" onChange={(e) => onClickImportGeoJson(e)} accept=".json" /> */}
      <button type="button" onClick={() => onClickImportGeoJson()}>
        Import GeoJSON
      </button>
      <textarea
        rows={5}
        style={{ width: 250 }}
        onChange={(e) => setGeojsonString(e.target.value)}
        value={geojsonString}
      />
    </div>
  );
};

export { ImportWKTorGeoJSON };
