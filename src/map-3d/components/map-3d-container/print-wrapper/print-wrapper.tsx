import { SceneMode } from 'cesium';
import classNames from 'classnames';
import React from 'react';
import { useAppSelector } from '../../../../app/hooks';
import { selectMap3DState } from '../../../shared/map-3d-slices';
import { PrintFooter, PrintHeader } from './components';

type PrintWrapperProps = {
  children: React.ReactNode;
  reportTitle: string;
};

export const PrintWrapper = React.forwardRef<HTMLDivElement, PrintWrapperProps>(
  ({ children, reportTitle }, ref) => {
    // Selectors.
    const { currentSceneMode } = useAppSelector(selectMap3DState);

    // Constants.
    const customClassName = classNames([
      'print-container',
      {
        'print-container--2d': currentSceneMode === SceneMode.SCENE2D,
      },
    ]);

    // Renders.
    return (
      <div className={customClassName} ref={ref}>
        <PrintHeader reportTitle={reportTitle} />
        {children}
        <PrintFooter />
      </div>
    );
  },
);
