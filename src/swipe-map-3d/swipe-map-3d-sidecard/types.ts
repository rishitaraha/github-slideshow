import { SideCardProps } from '@aus-platform/design-system';
import { ImageryLayer } from 'cesium';

export type SwipeMap3DSidecardProps = {
  isLeftSidecard: boolean;
  show: boolean;
} & Omit<SideCardProps, 'title'>;

export type SwipeMap3DBaseLayers = {
  left: ImageryLayer | null;
  right: ImageryLayer | null;
};
