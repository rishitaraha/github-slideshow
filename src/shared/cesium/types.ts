import { FixedLengthArray } from '../type-utils';

export type CartographicPosition = {
  longitude: number;
  latitude: number;
  altitude: number;
};

export type BoundingBox = FixedLengthArray<number, 4>;

export type FlyToArguments = {
  latitude: string;
  longitude: string;
  height?: number;
  heading?: number;
  pitch?: number;
  roll?: number;
};
