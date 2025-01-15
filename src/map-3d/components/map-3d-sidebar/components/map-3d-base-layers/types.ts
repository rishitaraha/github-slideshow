import { ImageryLayer } from 'cesium';

export type BaseLayerType = {
  name: string;
  imageryLayer: ImageryLayer | null;
  show: boolean;
  processing?: boolean;
};
