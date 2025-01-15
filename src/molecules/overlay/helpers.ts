import { generateId } from '../../shared/helpers/random-string';

export const generatePopoverId = (variableLength?: number) =>
  generateId({ prefix: 'popover', variableLength });
