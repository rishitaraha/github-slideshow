export type Image = {
  id: string;
  name: string;
  imageS3Key: string;
  thumbnailS3Key: string;
};

export type FeatureInfoImage = {
  id: string;
  info?: string;
  images?: Image[];
};
