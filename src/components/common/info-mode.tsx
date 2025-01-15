import React, { useEffect } from 'react';
import { InfoModeProps } from './type';
// import { viewPoint } from '../../shared/constants';

const InfoMode = ({ viewer }: InfoModeProps) => {
  const cesiumViewer = viewer.viewer;
  const infoTool = cesiumViewer?.infoTool;
  const onClickOn = () => {
    if (!infoTool) return;
    infoTool.activate();
  };

  const onClickOff = () => {
    cesiumViewer?.deactivateCurrentMapTool();
  };

  const listenerFeatureFocused = ([featureId]) => {
    console.info(`${featureId} is focused.`);
  };

  const listenerFeatureBlur = ([featureId]) => {
    console.info(`${featureId} is lost focus`);
  };

  useEffect(() => {
    infoTool?.featureInfoTool.eventOnFeatureFocus.addEventListener(listenerFeatureFocused);
    infoTool?.featureInfoTool.eventOnFeatureBlur.addEventListener(listenerFeatureBlur);

    return () => {
      infoTool?.featureInfoTool.eventOnFeatureFocus.removeEventListener(listenerFeatureFocused);
      infoTool?.featureInfoTool.eventOnFeatureBlur.removeEventListener(listenerFeatureBlur);
    };
  });

  return (
    <div>
      <p>Focus Feature Tool</p>
      <div>
        <button type="button" onClick={() => onClickOn()}>
          ON
        </button>
        <button type="button" onClick={() => onClickOff()}>
          OFF
        </button>
      </div>
    </div>
  );
};

export { InfoMode };
