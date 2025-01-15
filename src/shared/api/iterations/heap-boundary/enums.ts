export enum BaseReference {
  VisibleGround = 'visible_ground',
  SiteBaseDsm = 'site_base_dsm',
  OtherIterationDsm = 'other_iteration_dsm',
}

export enum HeapMaterialType {
  Other = 'other',
  Overburden = 'overburden',
  Ore = 'ore',
}

export enum HeapCategory {
  IncrementalDumpVolume = 'incremental_dump_volume',
  ExcavatedVolume = 'excavated_volume',
  StockVolume = 'stock_volume',
  Other = 'other',
}

export enum VolumeReportFormat {
  PDF = 'pdf',
  CSV = 'csv',
}
