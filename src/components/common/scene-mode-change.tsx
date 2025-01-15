import React from 'react';
import { SceneModeChangeProps } from './type';
// import { viewPoint } from '../../shared/constants';

const SceneModeChange = ({ viewer }: SceneModeChangeProps) => {
  const onClick2D = () => {
    viewer.switchTo2D();
  };

  const onClick3D = () => {
    viewer.switchTo3D();
  };

  return (
    <div>
      <p>Switch Scene Mode</p>
      <div>
        <button type="button" onClick={() => onClick2D()}>
          2D
        </button>
        <button type="button" onClick={() => onClick3D()}>
          3D
        </button>
      </div>
    </div>
  );
};

export { SceneModeChange };
