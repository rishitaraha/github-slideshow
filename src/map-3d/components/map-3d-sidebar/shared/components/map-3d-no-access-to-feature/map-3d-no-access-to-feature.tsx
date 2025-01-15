import { Icon, IconIdentifier } from '@aus-platform/design-system';
import React from 'react';

export const Map3DNoAccessToFeature: React.FC = () => {
  return (
    <div className="map-3d-no-access-to-feature">
      <Icon identifier={IconIdentifier.ExclamationCircle} size={100} />
      <span className="map-3d-no-access-to-feature__text">
        {`You don’t have permission for this specific feature`}
      </span>
    </div>
  );
};
