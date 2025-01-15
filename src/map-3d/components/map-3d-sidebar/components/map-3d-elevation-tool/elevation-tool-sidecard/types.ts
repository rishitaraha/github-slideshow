import { FormMessageVariant } from '@aus-platform/design-system';
import { LineRepresentation, Map3dElevationProfileState } from '../types';
import { ElevationFormMessage } from './enums';
import { IterationListItem } from 'shared/api';
import { Modify } from 'shared/type-utils';

export type SelectedIterationType = {
  [id: string]: {
    name: string;
  };
};

export type IterationListType = Modify<
  IterationListItem,
  {
    iterationDate?: Date | string;
    actions?: string;
  }
>;

export type ElevationToolSidecardProps = {
  elevationProfile: Map3dElevationProfileState;
  setElevationProfile: (elevationProfile: Map3dElevationProfileState) => void;
  setIterationIds: (iterationIds: string[]) => void;
  setLineCoordinates: (coordinates: LineRepresentation) => void;
};

export type ElevationProfileFormMessageType = {
  message: ElevationFormMessage;
  variant: FormMessageVariant;
} | null;
