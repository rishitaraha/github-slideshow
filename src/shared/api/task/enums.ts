export const enum ContinuedFromDatasetType {
  TASK = 'task',
  PARENT_ITERATION = 'parent_iteration',
  PARENT_MERGED_DATASET_INPUT = 'parent_merged_dataset_input',
  PARENT_MERGED_DATASET_OUTPUT = 'parent_merged_dataset_output',
}

export enum TaskDownloadType {
  Orthomosaic = 'orthomosaic',
  CapturedDSM = 'captured_dsm',
  PointCloud = 'point_cloud',
  Report = 'report',
  ProjectFile = 'project_file',
  OrthoTiles = 'ortho_tiles',
  All = 'all_outputs',
}
