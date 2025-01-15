import React from 'react';
import { CommonToolsContainer } from './common-styles';
import { SceneModeChange } from './scene-mode-change';
import { SceneModeChangeProps } from './type';
import { InfoMode } from './info-mode';

const Common = ({ viewer }: SceneModeChangeProps) => (
  <CommonToolsContainer>
    <SceneModeChange viewer={viewer} />
    <InfoMode viewer={viewer} />
  </CommonToolsContainer>
);

export { Common };
