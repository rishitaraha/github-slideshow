import React, { useEffect, createRef, useState } from 'react';
import {
  CesiumTerrainProvider,
  Resource,
  // @ts-ignore
  createWorldTerrainAsync
} from 'cesium';
import CesiumNavigation, { NavigationOptions } from "cesium-navigation-es6";
import { SplitViewer } from '@aus-platform/cesium';
import {
  ION_TOKEN,
  terrainURL,
  viewPoint,
  ORG_TOKEN,
} from '../../shared/constants';
import { sliderIcon } from '../../assets';

const SplitViewerContainer = () => {
  const [splitViewer, setSplitViewer] = useState<SplitViewer>()
  const [splitWidth, setSplitWidth] = useState(50);
  const cesiumLeftRef = createRef<HTMLDivElement>();
  const cesiumRightRef = createRef<HTMLDivElement>();
  const sliderRef = createRef<HTMLDivElement>();
  let cesiumContainerLeft = cesiumLeftRef.current;
  let cesiumContainerRight = cesiumRightRef.current;
  let slider = sliderRef.current;

  useEffect(() => {
    if(!cesiumContainerLeft) {
      cesiumContainerLeft = cesiumLeftRef.current
    }
    if(!cesiumContainerRight) {
      cesiumContainerRight = cesiumRightRef.current
    }
    if(!slider) {
      slider = sliderRef.current;
    }

    const terrainResource = new Resource({
      url: terrainURL,
      headers: {
        'X-Org-Access-Token': ORG_TOKEN
      }
    });
    
    CesiumTerrainProvider.fromUrl(terrainResource, {
      requestVertexNormals: true
    }).then((terrainProviderLeft) => {
      createWorldTerrainAsync().then(terrainProviderRight => {
        if (!cesiumContainerLeft || !cesiumContainerRight || !slider) {
          return;
        }  
        if (cesiumContainerLeft.hasChildNodes()) return;
        if (cesiumContainerRight.hasChildNodes()) return;
          const viewer = new SplitViewer({
          cesiumContainerLeft,
          cesiumContainerRight,
          slider,
          token: ION_TOKEN,
          optionsLeft: {
            terrainProvider: terrainProviderLeft
          },
          optionsRight: {
            terrainProvider: terrainProviderRight,
          }
        });
        setSplitViewer(viewer);
      }).catch((e) => {
        console.info(`Failed to created terrain: ${e}`);
        return; 
      })
    }).catch((e) => {
      console.info(`Failed to created terrain: ${e}`);
      return;
    });
  }, [])

  const sliderChangeEvent = ([newWidth]) => {}

  useEffect(() => {
    if (splitViewer) {
      if (splitViewer.viewerRight.viewer){
        const navigationOptions: NavigationOptions = {
          enableCompass: true,
          enableZoomControls: false,
          enableDistanceLegend: false,
          enableCompassOuterRing: true,
        };
  
        new CesiumNavigation(splitViewer.viewerRight.viewer, navigationOptions);
      }

      splitViewer.flyTo({longitude: viewPoint[0], latitude: viewPoint[1]});
      splitViewer.eventSliderChanged.addEventListener(sliderChangeEvent)
      return () => {
        splitViewer.eventSliderChanged.removeEventListener(sliderChangeEvent)
      }
    }
  }, [splitViewer]);

  return (
    <div className="App">
      <div className="split-viewer-container">
        <div className="cesium-container-left" ref={cesiumLeftRef} />
        <div className='cesium-split-slider' ref={sliderRef}>
          <div className='cesium-split-slider-circle'>
            <img src={sliderIcon} className='slider-icon'/>
          </div>
        </div>
        <div className="cesium-container-right" ref={cesiumRightRef} />
      </div>
    </div>
  );
};

export default SplitViewerContainer;
