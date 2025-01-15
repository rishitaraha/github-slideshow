import { IterationDataset } from 'src/shared/api';

export type ViewGeotagGcpMapProps = {
  dataset: IterationDataset;
  showGeotagImageActionButton: boolean;
  showGCPActionButton: boolean;
  onClickGeotagImagePoint: (e) => void;
  onClickGCPImagePoint: (e) => void;
};
