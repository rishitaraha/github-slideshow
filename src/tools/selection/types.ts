import { GEOMETRY_TYPE } from '../../utils';
import { MapToolConstructorOptions } from '../base';

export type FeatureInfoType = {
  id: string;
  type: GEOMETRY_TYPE;
};

export interface SelectFeatureConstructorOptions
  extends MapToolConstructorOptions {
  selectedFeatures: FeatureInfoType[];
  local?: string | string[];
  properties?: Record<string, any>;
}
