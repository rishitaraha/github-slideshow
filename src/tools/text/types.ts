import { MapToolConstructorOptions } from '../base';

export interface TextboxDrawConstructorOptions
  extends MapToolConstructorOptions {
  local?: string | string[];
  properties?: Record<string, any>;
}
