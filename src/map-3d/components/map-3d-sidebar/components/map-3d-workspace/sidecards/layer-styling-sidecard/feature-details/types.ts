import { SelectOption } from '@aus-platform/design-system';

export type FeatureDetailsInputType = {
  layerName: string;
};

export type FeatureDetailsPropsType = {
  layerAccessTags: SelectOption<string>[];
  isAccessTagListLoading: boolean;
};
