import { IterationDataset } from 'src/shared/api';

export type GeotagsModalUploadPreviewProps = {
  onClose: VoidFunction;
};

export type GeotagsSchemaModalProps = {
  iterationDataset: IterationDataset;
  onClose: VoidFunction;
  isUploadingGeotags?: boolean;
  geotagFileObject?: File | null;
};
