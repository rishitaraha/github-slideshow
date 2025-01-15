import { GEOMETRY_TYPE } from '../../utils';
import { MapToolConstructorOptions } from '../base';

/**
 * Options for info tool
 */
export interface FeatureInfoConstructorOptions
  extends MapToolConstructorOptions {
  properties?: Record<string, any>;
}

export type SelectedFeature = {
  id: string;
  type: GEOMETRY_TYPE;
};
