import { Position } from 'geojson';
import JSZip from 'jszip';
import prj2epsg from 'prj2epsg';
import proj4 from 'proj4';
import shp from 'shpjs';
import { EPSG4326 } from '../shared';

export const shape2GeojsonFromZipFile = async (file: File) => {
  try {
    const arrayBuffer: ArrayBuffer = await file.arrayBuffer();
    const geojson = await shp(arrayBuffer);
    return geojson;
  } catch (e: any) {
    console.error(e.message);
  }

  return undefined;
};

export const getFeaturesDataFromZipFile = async (file: File) => {
  const arrayBuffer = await file.arrayBuffer();
  const jsZip = new JSZip();

  let zipData: JSZip | null = null;
  try {
    zipData = await jsZip.loadAsync(arrayBuffer);
  } catch (e: any) {
    console.error('It is invalid zip file. Please select correct zip file.');
    return undefined;
  }

  if (!zipData) {
    return undefined;
  }

  const checkFiles = Object.keys(zipData.files).filter(
    (fileName: string) =>
      fileName.includes('.shp') ||
      fileName.includes('.dbf') ||
      fileName.includes('.prj'),
  );

  if (!checkFiles || checkFiles.length < 3) {
    console.error(
      'It is not containing valid files(shp, dbf, proj). Please select correct zip file.',
    );
    return undefined;
  }

  const prjFileName = Object.keys(zipData.files).find((fileName: string) =>
    fileName.includes('.prj'),
  );
  if (prjFileName) {
    const jsZipObject = zipData.file(prjFileName);
    if (!jsZipObject) {
      return undefined;
    }

    const data: string = await jsZipObject.async('string');

    const epsgCode = prj2epsg.fromPRJ(data);
    const result = await shape2GeojsonFromZipFile(file);
    if (result && 'features' in result) {
      return { epsg: epsgCode, features: result.features };
    }
  }

  return undefined;
};

export const reprojectCoordinatesTo4326 = (
  coordinates: Position[],
  fromEpsgCode: number,
) =>
  coordinates.map((item) =>
    proj4(`EPSG:${fromEpsgCode}`, `EPSG:${EPSG4326}`, item),
  );
