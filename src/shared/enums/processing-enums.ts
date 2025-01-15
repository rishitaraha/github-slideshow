export const enum ProcessingStatus {
  Completed = 'completed',
  Cancelled = 'cancelled',
  Error = 'error',
  Pending = 'pending',
  Processing = 'processing',
}

export enum CroppingRegionBehaviour {
  Include = 'include',
  Exclude = 'exclude',
}

export enum UidInitials {
  Task = 'T',
  Iteration = 'I',
  MergedDataset = 'MD',
  Site = 'S',
}
