export enum AreaOfInterest {
  Draw,
  WorkspaceLineFeatures,
}

export enum ElevationFormMessage {
  NoLineErrors = 'There are no line layers in the workspace. Add layers and try again',
  SelectFeature = 'Click on a line feature in the viewport to select',
  NotLineFeature = 'Only line features are supported for this action',
}
