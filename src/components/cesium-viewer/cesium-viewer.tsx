import React, { useEffect, createRef, useState } from 'react';
import {
  CesiumTerrainProvider,
  Resource,
  // @ts-ignore
  VERSION
} from 'cesium';
import { CesiumViewer, MVTImageryProvider, StyleSpecification } from '@aus-platform/cesium';
import GUI from '../GUI';
import {
  ION_TOKEN,
  mvtMaxZoom,
  mvtMinZoom,
  mvtURL,
  glyphsURL,
  terrainURL,
  viewBound,
  viewPoint,
  ORG_TOKEN
} from '../../shared/constants';

const CesiumViewerContainer = () => {
  const cesiumRef = createRef<HTMLDivElement>();
  let cesiumContainer = cesiumRef.current;
  const [cesiumViewer, setCesiumViewer] = useState<CesiumViewer | undefined>(undefined);

  const setupLayers = () => {
    if (!cesiumViewer) {
      return;
    }

    const layers = cesiumViewer.viewer!.scene.imageryLayers;

    const mvtStyle = {
      version: 8,
      glyphs: glyphsURL,
      sources: {
        contours: {
          type: 'vector',
          tiles: [mvtURL]
        }
      },
      layers: [
        {
          id: '1',
          type: 'line',
          source: 'contours',
          'source-layer': 'contour',
          paint: {
            'line-color': '#a50d0d',
            'line-width': ['match', ['get', 'line_type'], 'major', 3, 1]
          }
        },
        {
          id: 'Freight/label/Default',
          type: 'symbol',
          source: 'contours',
          'source-layer': 'contour',
          filter: ['all', ['==', 'line_type', 'major']],
          minzoom: 16,
          layout: {
            'symbol-avoid-edges': true,
            'text-font': ['Open Sans Semibold'],
            'text-size': 14,
            'text-field': '{elevation} m',
            'symbol-placement': 'point',
            'symbol-spacing': 1000,
            'text-rotation-alignment': 'viewport'
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 0.5
          }
        }
      ]
    };

    const mvtProvider = new MVTImageryProvider({
      style: mvtStyle as StyleSpecification,
      minzoom: mvtMinZoom,
      maxzoom: mvtMaxZoom,
      bounds: viewBound,
      transformRequest(url, resourceType) {
        const res = { url };

        if (resourceType == 'Tile') {
          res['headers'] = { 'X-Org-Access-Token': ORG_TOKEN };
        }

        return res;
      }
    });

    mvtProvider.readyPromise.then(() => {
      // @ts-ignore
      layers.addImageryProvider(mvtProvider);
    });
  };

  useEffect(() => {
    if (!cesiumContainer) {
      cesiumContainer = cesiumRef.current;
      return;
    }
    console.info(VERSION);
    if (cesiumContainer.hasChildNodes()) return;
    (async () => {
      const terrainResource = new Resource({
        url: terrainURL,
        headers: {
          'X-Org-Access-Token': ORG_TOKEN
        }
      });

      try {
        const terrainProvider = await CesiumTerrainProvider.fromUrl(terrainResource, {
          requestVertexNormals: true
        });

        const viewer = new CesiumViewer(cesiumContainer, ION_TOKEN, {
          terrainProvider
        });

        setCesiumViewer(viewer);
      } catch (e) {
        console.info(`Failed to created terrain: ${e}`);
      }
    })();
  }, []);

  useEffect(() => {
    if (cesiumViewer) {
      setupLayers();

      cesiumViewer.flyTo(viewPoint[0], viewPoint[1]);
      cesiumViewer.viewer?.canvas.focus();
    }
  }, [cesiumViewer]);

  return (
    <div className="App">
      <div className="cesium-container" ref={cesiumRef} />
      {cesiumViewer && <GUI viewer={cesiumViewer} />}
    </div>
  );
};

export default CesiumViewerContainer;
