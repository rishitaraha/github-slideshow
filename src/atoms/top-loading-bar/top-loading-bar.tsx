import React from 'react';
import LoadingBar from 'react-top-loading-bar';
import { ColorCodes } from '../../enums';

type LoadingBarRef = {
  add(value: number): void;
  decrease(value: number): void;
  continuousStart(startingValue?: number, refreshRate?: number): void;
  staticStart(startingValue: number): void;
  complete(): void;
};

export let loadingBarRef: React.RefObject<LoadingBarRef> | undefined;

export const startTopLoading = () => {
  if (loadingBarRef) {
    loadingBarRef.current?.continuousStart();
  }
};

export const completeTopLoading = () => {
  if (loadingBarRef) {
    loadingBarRef.current?.complete();
  }
};

export const TopLoadingBar: React.FC = () => {
  return (
    <LoadingBar className="aus-top-loader" color={ColorCodes.Primary500} />
  );
};
