import { Placement } from '@aus-platform/design-system';
import { ReactNode } from 'react';

export type DatasetDetailsTooltipProps = {
  children: ReactNode;
  siteName?: string;
  layerName?: string;
  iterationName?: string;
  placement?: Placement;
  show?: boolean;
};

export type TooltipTextProps = {
  siteName?: string;
  layerName?: string;
  iterationName?: string;
};
