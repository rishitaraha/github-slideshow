import { FeatureInfoType } from '@aus-platform/cesium';

export type SelectFeatureListener = (featureInfo: FeatureInfoType[]) => void;
export type SelectToolEventListener = SelectFeatureListener | VoidFunction;
