export enum FileUploadStage {
  AddIterationName = 'addIterationName',
  SelectImagesToUpload = 'selectImagesToUpload',
  Uploading = 'uploading',
  Error = 'error',
  MinimumImagesError = 'minimumImagesError',
  ImagesPreviouslyUploadedError = 'imagesPreviouslyUploadedError',
  Uploaded = 'uploaded',
  Cancelled = 'cancelled',
  StartingToUpload = 'startingToUpload',
  NetworkError = 'networkError',
  Processing = 'processing',
  QueuedToUpload = 'queuedToUpload',
}

export enum ProgressBarStateImageUpload {
  Cancelled = 'cancelled',
  Uploaded = 'uploaded',
  Error = 'error',
  StartingToUpload = 'startingToUpload',
  Processing = 'processing',
  Completed = 'completed',
  NetworkError = 'networkError',
  AddMoreImagesError = 'addMoreImagesError',
  Uploading = 'uploading',
  ImagesPreviouslyUploadedError = 'imagesPreviouslyUploadedError',
}

export enum FileUploadStatus {
  AlreadyUploaded = 'alreadyUploaded',
  Pending = 'pending',
  Completed = 'completed',
  Failed = 'failed',
}

export enum FileExtension {
  Jpg = 'jpg',
  Jpeg = 'jpeg',
  Png = 'png',
}

export enum ProcessIdKeysInLocalStorage {
  UploadProcessesQueue = 'uploadProcessesQueue',
}

export const enum GCPUploadAction {
  APPEND = 'append',
  REPLACE = 'replace',
  NONE = 'none',
}

export const enum GCPType {
  CONTROLPOINT = 'controlpoint',
  CHECKPOINT = 'checkpoint',
}

export const enum GCPTypeLabel {
  GCP = 'GCP',
  CHECKPOINT = 'Checkpoint',
}

export enum ActiveGeotagImageUploadHandlerModal {
  FileSelector = 'FileSelector',
  SchemaSelector = 'SchemaSelector',
}

export enum ProcessingStagesValue {
  AlignPhotos = 'align-photos',
  GeneratePointCloud = 'generate-point-cloud',
  GenerateOrthomosaic = 'generate-orthomosaic',
  StopAfterReOptimizeCamera = 'stop-after-reoptimize-camera',
}

export const ProcessingStagesLabel = {
  [ProcessingStagesValue.AlignPhotos]: 'Align Photos',
  [ProcessingStagesValue.GeneratePointCloud]: 'Generate Point Cloud',
  [ProcessingStagesValue.GenerateOrthomosaic]: 'Generate Orthomosaic',
  [ProcessingStagesValue.StopAfterReOptimizeCamera]:
    'Stop Camera After Re-optimize',
} as const;

export const enum GCPModalView {
  TableView = 'table-view',
  TaggingView = 'tagging-view',
  MapView = 'map-view',
}
