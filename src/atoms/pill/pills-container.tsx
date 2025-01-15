import React from 'react';
import { Pill, PillProps } from './pill';

export type PillsContainerProps = PillProps & {
  limit?: number;
};

export const PillsContainer: React.FC<PillsContainerProps> = ({
  limit,
  children,
  ...rest
}) => {
  const childrenArray = React.Children.toArray(children);
  const renderPills = () => {
    const pills: React.ReactNode[] = [];
    const pillsArraySize =
      limit && Math.min(childrenArray.length, limit) === limit
        ? limit
        : childrenArray.length;

    for (let i = 0; i < pillsArraySize; i++) {
      pills.push(childrenArray[i]);
    }
    if (pillsArraySize < childrenArray.length) {
      pills.push(
        <Pill key={'pill' + 'i'} {...rest}>
          {' '}
          +{childrenArray.length - pillsArraySize}
        </Pill>,
      );
    }
    return pills;
  };
  return <div className="aus-pill-container">{renderPills()}</div>;
};
