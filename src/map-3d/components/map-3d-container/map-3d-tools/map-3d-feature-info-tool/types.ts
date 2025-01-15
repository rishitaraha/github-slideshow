import { FeatureInfoImage } from '../../../../../shared/api';

export type FeatureInfoInputType = {
  featureId: string;
  featureInformation?: string;
  featureImages: Array<FeatureInfoImageObjectType>;
};

export type FeatureInfoImageObjectType = Omit<
  FeatureInfoImage,
  'imageS3Key' | 'thumbnailS3Key'
> & {
  isUploaded: boolean;
  imageFile: File | null;
  imageSource: string | null;
  thumbnailSource: string | null;
};

export type FeatureImagePreviewerStateType = {
  show: boolean;
  selectedImageIndex: number | null;
  selectedFeatureImage: FeatureInfoImageObjectType | null;
};
