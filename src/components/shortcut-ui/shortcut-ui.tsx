import React, { useState } from 'react';
import { MIN_RESPONSE_TIME, ShortCutResponseTime } from '@aus-platform/cesium';
import {
  ShortcutName,
  ShortcutSlider,
  ShortcutTime,
  ShortcutTypeContainer,
  ShortcutUIContainer
} from './shortcut-ui-styles';
import { ShortCutFunction, ShortcutUIProps } from '../types';

export const ShortcutUI = ({ viewer }: ShortcutUIProps) => {
  const [panningTime, setPanningTime] = useState(`${MIN_RESPONSE_TIME}`);
  const [hRotateTime, setHRotateTime] = useState(`${MIN_RESPONSE_TIME}`);
  const [vRotateTime, setVRotateTime] = useState(`${MIN_RESPONSE_TIME}`);
  const [zoomTime, setZoomTime] = useState(`${MIN_RESPONSE_TIME}`);
  const responseTime: ShortCutResponseTime = {
    PanningResponseTime: MIN_RESPONSE_TIME,
    HRotatingResponseTime: MIN_RESPONSE_TIME,
    VRotatingResponseTime: MIN_RESPONSE_TIME,
    ZoomingResponseTime: MIN_RESPONSE_TIME
  };

  const handleChange = (key: string, event: React.ChangeEvent<HTMLInputElement>) => {
    switch (key) {
      case ShortCutFunction.PANNING:
        setPanningTime(event.target.value);
        responseTime.PanningResponseTime = parseInt(event.target.value, 10);
        break;
      case ShortCutFunction.HROTATION:
        setHRotateTime(event.target.value);
        responseTime.HRotatingResponseTime = parseInt(event.target.value, 10);
        break;
      case ShortCutFunction.VROTATION:
        setVRotateTime(event.target.value);
        responseTime.VRotatingResponseTime = parseInt(event.target.value, 10);
        break;
      case ShortCutFunction.ZOOM:
        setZoomTime(event.target.value);
        responseTime.ZoomingResponseTime = parseInt(event.target.value, 10);
        break;
      default:
        break;
    }
    viewer.setShortcutResponseTime(responseTime);
  };

  return (
    <ShortcutUIContainer>
      <ShortcutTypeContainer>
        <ShortcutName>Panning: WASD</ShortcutName>
        <ShortcutSlider>
          <input
            type="range"
            min="10"
            max="500"
            className="slider"
            id="myRange"
            value={panningTime}
            onChange={(e) => handleChange('PA', e)}
          />
        </ShortcutSlider>
        <ShortcutTime>{panningTime}ms</ShortcutTime>
      </ShortcutTypeContainer>
      <ShortcutTypeContainer>
        <ShortcutName>Horizontal Rotation: QE</ShortcutName>
        <ShortcutSlider>
          <input
            type="range"
            min="10"
            max="500"
            className="slider"
            id="myRange"
            value={hRotateTime}
            onChange={(e) => handleChange('HR', e)}
          />
        </ShortcutSlider>
        <ShortcutTime>{hRotateTime}ms</ShortcutTime>
      </ShortcutTypeContainer>
      <ShortcutTypeContainer>
        <ShortcutName>Vertical Rotation: RF</ShortcutName>
        <ShortcutSlider>
          <input
            type="range"
            min="10"
            max="500"
            className="slider"
            id="myRange"
            value={vRotateTime}
            onChange={(e) => handleChange('VR', e)}
          />
        </ShortcutSlider>
        <ShortcutTime>{vRotateTime}ms</ShortcutTime>
      </ShortcutTypeContainer>
      <ShortcutTypeContainer>
        <ShortcutName>Zoom: ZX</ShortcutName>
        <ShortcutSlider>
          <input
            type="range"
            min="10"
            max="500"
            className="slider"
            id="myRange"
            value={zoomTime}
            onChange={(e) => handleChange('ZO', e)}
          />
        </ShortcutSlider>
        <ShortcutTime>{zoomTime}ms</ShortcutTime>
      </ShortcutTypeContainer>
    </ShortcutUIContainer>
  );
};
