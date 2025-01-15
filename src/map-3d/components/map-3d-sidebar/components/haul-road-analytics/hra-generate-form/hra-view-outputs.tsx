import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import React from 'react';

export const HRAViewOutputs: React.FC<{
  onClickViewOutputs: VoidFunction;
  onClickNewHaulRoad: VoidFunction;
}> = ({ onClickNewHaulRoad, onClickViewOutputs }) => {
  return (
    <div className="hra-view-outputs">
      <Icon
        identifier={IconIdentifier.Loading}
        size={80}
        colorClass={ColorClass.Primary500}
        className="hra-view-outputs__icon"
      />
      <div className="hra-view-outputs__text">
        <strong>Generating Haul Road</strong>
        <p>Haul Road Generation is in progress. Check outputs for updates</p>
        <Button variant={ButtonVariant.Primary} onClick={onClickViewOutputs}>
          View In Outputs
        </Button>
        <Button variant={ButtonVariant.Pill} onClick={onClickNewHaulRoad}>
          Generate New Haul Road
        </Button>
      </div>
    </div>
  );
};
