import React from 'react';
import { Icon } from '../../atoms';
import { ColorClass, IconIdentifier } from '../../enums';
import { StatusIndicatorLevel } from './enum';

export type StatusIndicatorProps = {
  iconIdentifier: IconIdentifier;
  iconColorClass?: ColorClass;
  status: StatusIndicatorLevel;
  iconSize?: number;
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  iconIdentifier,
  iconColorClass = ColorClass.Primary500,
  status,
  iconSize = 24,
}) => {
  const getColorState = () => {
    switch (status) {
      case StatusIndicatorLevel.Started:
      case StatusIndicatorLevel.Processing:
        return ColorClass.AccentWarning;
      case StatusIndicatorLevel.Completed:
        return ColorClass.AccentSuccess;
      case StatusIndicatorLevel.Failed:
      case StatusIndicatorLevel.Deleted:
        return ColorClass.AccentError;
      case StatusIndicatorLevel.Importing:
        return ColorClass.Primary500;
      case StatusIndicatorLevel.Done:
        return ColorClass.AccentSuccess;
    }
  };
  const getStateIcon = () => {
    switch (status) {
      case StatusIndicatorLevel.Started:
      case StatusIndicatorLevel.Processing:
        return IconIdentifier.Loading;
      case StatusIndicatorLevel.Completed:
        return IconIdentifier.CheckCircle;
      case StatusIndicatorLevel.Deleted:
      case StatusIndicatorLevel.Failed:
        return IconIdentifier.CloseCircle;
      case StatusIndicatorLevel.Importing:
        return IconIdentifier.ImportExport;
      case StatusIndicatorLevel.Done:
        return IconIdentifier.CheckCircle;
    }
  };

  return (
    <div className="state-icon-container">
      <Icon
        identifier={iconIdentifier}
        colorClass={iconColorClass}
        size={iconSize}
        className="overlay-icon"
      />
      <Icon
        size={iconSize / 2}
        className="overlay-state"
        colorClass={getColorState()}
        identifier={getStateIcon()}
      />
    </div>
  );
};
