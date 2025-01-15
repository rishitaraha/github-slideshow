import { Icon, IconIdentifier } from '@aus-platform/design-system';
import React from 'react';

type DSMStatusIndicatorProps = {
  iconIdentifier: IconIdentifier;
  title: string;
  description: string;
};

export const DSMStatusIndicator: React.FC<DSMStatusIndicatorProps> = ({
  title,
  description,
  iconIdentifier,
}) => {
  return (
    <div className="dsm-status-indicator">
      <Icon
        identifier={iconIdentifier}
        className="dsm-status-indicator__icon"
        size={78}
      />

      <p className="dsm-status-indicator__title">{title}</p>
      <p className="dsm-status-indicator__description">{description}</p>
    </div>
  );
};
