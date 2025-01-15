import { ColorClass, IconIdentifier } from '@aus-platform/design-system';
import { LayerType } from '../shared/api/layers';

export type LayersOptionType = {
  label: string;
  value: LayerType;
} | null;

export type ClampedStateIndicator = {
  identifier: IconIdentifier;
  colorClass: ColorClass;
  hoverText: React.ReactNode;
};
