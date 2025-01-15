import { PaginationState } from '@tanstack/react-table';
import { CarouselStep, GeotagImagesModalView } from '../enum';
import {
  GeotagImageListQueryParams,
  GeotagImageObj,
  IterationDataset,
} from 'src/shared/api';

export type GeotagImagesContextProps = {
  iterationDataset: IterationDataset;
  geotagImages: GeotagImageObj[];
  geotagImagePayload: GeotagImageListQueryParams;
  paginationProps: PaginationState;
  setPaginationProps: React.Dispatch<React.SetStateAction<PaginationState>>;
  setGeotagImagePayload: React.Dispatch<
    React.SetStateAction<GeotagImageListQueryParams>
  >;
  isCRSGeographic: boolean;
  showDeleteModal: boolean;
  onUploadImages: VoidFunction;
  displayUploadGeotagsFile: VoidFunction;
  refetchGeotagImages: VoidFunction;
  showDeleteGeotagsModal: VoidFunction;
  hideDeleteGeotagsModal: VoidFunction;
  pageCount: number;
  isLoading: boolean;
  rowSelection: any;
  showToggleGeotagImagesModal: boolean;
  showEditGeotagImagesModal: boolean;
  searchText: string;
  setSearchText: (value) => void;
  actionSelectedGeotagImage: GeotagImageObj | undefined;
  setActionSelectedGeotagImage: React.Dispatch<
    React.SetStateAction<GeotagImageObj | undefined>
  >;
  modalPageView: GeotagImagesModalView;
  setModalPageView: React.Dispatch<React.SetStateAction<GeotagImagesModalView>>;
  getSteppedGeotagImageItem: (step: CarouselStep, id: string) => void;
  setShowEditGeotagImagesModal: React.Dispatch<React.SetStateAction<boolean>>;
  setRowSelection: React.Dispatch<React.SetStateAction<any>>;
  setShowToggleGeotagImagesModal: React.Dispatch<React.SetStateAction<boolean>>;
};

export type GeotagImagesProviderProps = {
  iterationDataset: IterationDataset;
  onUploadImages: VoidFunction;
  displayUploadGeotagsFile: VoidFunction;
  children: React.ReactNode;
};
