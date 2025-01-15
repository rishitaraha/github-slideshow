import classNames from 'classnames';
import React from 'react';
import { FabStackProps } from './types';
import { FabOrientation } from './enums';

export const FabStack = React.forwardRef<HTMLDivElement, FabStackProps>(
  (
    { orientation = FabOrientation.Horizontal, className, children, ...rest },
    ref,
  ) => {
    // Constants.
    const ausFabStackClassName = classNames(
      ['aus-fab-stack', className],
      `aus-fab-stack--${orientation}`,
    );

    // Renders.
    return (
      <div className={ausFabStackClassName} ref={ref} {...rest}>
        {children}
      </div>
    );
  },
);
