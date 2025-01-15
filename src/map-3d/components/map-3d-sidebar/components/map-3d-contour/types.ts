export type ContourFormType = {
  name: string;
  accessTags: Array<{
    value: string;
    label: string;
  }> | null;
  minorInterval: number;
  majorInterval: number;
  lowestAltitude: number;
  highestAltitude: number;
  thresholdValue: number;
  smoothingFilterSize: number;
};

export type DsmElevationDataType = {
  min: number;
  max: number;
};

export type GenerateContourFormProps = {
  setShowContourForm: (state: boolean) => void;
  dsmElevationBounds: DsmElevationDataType | null;
};

export type GeneratingContourProps = {
  setShowContourForm: (state: boolean) => void;
};

export type ContourValidatorType = {
  highestAltitude: {
    lowerBound: number;
  };
  lowestAltitude: {
    upperBound: number;
  };
  accessTags: {
    isUserOrgAdmin: boolean;
  };
};
