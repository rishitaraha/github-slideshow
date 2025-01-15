import { GeotagImageObj } from 'src/shared/api';

export type GeotagImagesModalProps = {
  onClose: VoidFunction;
};

export type CheckedFilterOptionsType = {
  imagesWithGeotags: boolean;
  imagesWithoutGeotags: boolean;
  geotagsWithoutImages: boolean;
};

export type FilterOptionsOverlayProps = {
  checkedOptions: CheckedFilterOptionsType;
  onCheckChange: (option) => void;
};

export type GeotagTableRowData = GeotagImageObj & { sno: number };
