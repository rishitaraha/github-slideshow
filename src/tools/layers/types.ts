import { UrlTemplateImageryProvider } from 'cesium';
import { CesiumViewerType } from '../../types';

export interface CesiumLayerConstructorOptions {
  name: string;
  id: string;
  isActive: boolean;
  hasRaster: boolean;
  rasterLayerOptions?: UrlTemplateImageryProvider.ConstructorOptions;
  viewer: CesiumViewerType;
  show: boolean;
  properties?: Record<string, any>;
}
