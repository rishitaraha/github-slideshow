import { SwipeMap3DSpotInfo } from './types';

export const SpotValidationMessage = {
  OutOfBounds: 'Out of Bounds',
  DSMNotFound: 'DSM Not Found',
  ItrNotSelected: 'ITR Not Selected',
};

export const spotInfoInitialState: SwipeMap3DSpotInfo = {
  latitude: '0',
  longitude: '0',
  leftIterationAltitude: SpotValidationMessage.ItrNotSelected,
  rightIterationAltitude: SpotValidationMessage.ItrNotSelected,
};
