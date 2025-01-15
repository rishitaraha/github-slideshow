import { isNil, isUndefined } from 'lodash';

export const extractHistogramXyRange = (statistics: any) => {
  const minY = 0;
  let maxY = 0;
  let minX = 2147483647;
  let maxX = -2147483646;

  for (const i in statistics) {
    const band = statistics[i];
    minX = Math.min(minX, band.min);
    maxX = Math.max(maxX, band.max);
    maxY = Math.max(maxY, Math.max(...band.histogram[0]));
  }

  return {
    minX,
    maxX,
    minY,
    maxY,
  };
};

export const getInitialRescaleValue = (
  metadata: any,
  sourceFilePath: string,
) => {
  if (isNil(metadata) || !sourceFilePath) {
    return;
  }

  const metadataStatistics = metadata.statistics;
  const { minX: minValue, maxX: maxValue } =
    extractHistogramXyRange(metadataStatistics);

  if (metadataStatistics && !isUndefined(minValue) && !isUndefined(maxValue)) {
    const initialRescaleValue = `${Math.floor(minValue)},${Math.ceil(
      maxValue,
    )}`;

    return initialRescaleValue;
  }
};
