import { paginationInitialState, toast } from '@aus-platform/design-system';
import { PaginationState, RowSelectionState } from '@tanstack/react-table';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  CarouselStep,
  GeotagImagesModalView,
} from '../geotag-images-modal/enum';
import {
  GeotagImagesContextProps,
  GeotagImagesProviderProps,
} from '../geotag-images-modal/geotag-images-table/type';
import { GeotagTableRowData } from '../geotag-images-modal/types';
import {
  GeotagImageListQueryParams,
  GeotagImageObj,
  useGetGeotagImageListRequest,
} from 'src/shared/api';
import { EPSGCode } from 'shared/enums';

const GeotagImagesContext = createContext<GeotagImagesContextProps | undefined>(
  undefined,
);

export const GeotagImagesProvider: React.FC<GeotagImagesProviderProps> = ({
  iterationDataset,
  onUploadImages,
  displayUploadGeotagsFile,
  children,
}) => {
  const [modalPageView, setModalPageView] = useState<GeotagImagesModalView>(
    GeotagImagesModalView.Table,
  );
  const [paginationProps, setPaginationProps] = useState<PaginationState>(
    paginationInitialState,
  );
  const [pageCount, setPageCount] = useState(0);
  const [searchText, setSearchText] = useState('');
  const [geotagImages, setGeotagImages] = useState<GeotagTableRowData[]>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionSelectedGeotagImage, setActionSelectedGeotagImage] =
    useState<GeotagImageObj>();

  const [showToggleGeotagImagesModal, setShowToggleGeotagImagesModal] =
    useState(false);
  const [showEditGeotagImagesModal, setShowEditGeotagImagesModal] =
    useState(false);
  const [geotagImagePayload, setGeotagImagePayload] =
    useState<GeotagImageListQueryParams>({
      search: '',
      imagesWithGeotags: false,
      imagesWithoutGeotags: false,
      geotagsWithoutImages: false,
    });

  const fetchParams = {
    iterationDataset: iterationDataset.id, // TODO: Add merged_dataset later.
    pageNumber: paginationProps.pageIndex,
    pageSize: paginationProps.pageSize,
    ...geotagImagePayload,
  };

  const {
    data: geotagImagesResponse,
    isLoading,
    isSuccess,
    isError,
    refetch: refetchGeotagImages,
  } = useGetGeotagImageListRequest(fetchParams);

  useEffect(() => {
    if (geotagImagesResponse && isSuccess) {
      setPageCount(
        Math.ceil(geotagImagesResponse.data.total / paginationProps.pageSize),
      );
      const startingSno =
        paginationProps.pageIndex * paginationProps.pageSize + 1;
      const geotagImagesWithSno = geotagImagesResponse.data.geotagImages.map(
        (image, index) => ({
          ...image,
          sno: startingSno + index,
        }),
      );
      setRowSelection({});
      setGeotagImages(geotagImagesWithSno);
    }

    if (isError) {
      toast.error('Error loading geotag images');
    }
  }, [
    geotagImagesResponse,
    isSuccess,
    isLoading,
    paginationProps.pageIndex,
    paginationProps.pageSize,
  ]);

  const isCRSGeographic =
    iterationDataset.geotagHorizontalCrs === EPSGCode.WGS84;

  const showDeleteGeotagsModal = () => setShowDeleteModal(true);
  const hideDeleteGeotagsModal = () => setShowDeleteModal(false);

  const getSteppedGeotagImageItem = (step: CarouselStep, id: string) => {
    let updatedIndex = 0;
    const currentIndex = geotagImages.findIndex((item) => item.id === id);

    if (currentIndex >= 0) {
      updatedIndex =
        step === CarouselStep.Next ? currentIndex + 1 : currentIndex - 1;
      if (updatedIndex >= geotagImages.length) {
        updatedIndex = 0;
      }
      if (updatedIndex < 0) {
        updatedIndex = geotagImages.length - 1 || 0;
      }
    }

    const steppedGeotagImage = geotagImages.find(
      (gi) => gi.sno === updatedIndex + 1,
    );

    setActionSelectedGeotagImage(steppedGeotagImage);
  };

  const value = {
    iterationDataset,
    geotagImages,
    geotagImagePayload,
    paginationProps,
    isCRSGeographic,
    rowSelection,
    showToggleGeotagImagesModal,
    showEditGeotagImagesModal,
    setShowEditGeotagImagesModal,
    actionSelectedGeotagImage,
    setActionSelectedGeotagImage,
    setRowSelection,
    setPaginationProps,
    setShowToggleGeotagImagesModal,
    setGeotagImagePayload,
    onUploadImages,
    refetchGeotagImages,
    displayUploadGeotagsFile,
    showDeleteModal,
    modalPageView,
    setModalPageView,
    showDeleteGeotagsModal,
    hideDeleteGeotagsModal,
    getSteppedGeotagImageItem,
    pageCount,
    isLoading,
    searchText,
    setSearchText,
  };

  return (
    <GeotagImagesContext.Provider value={value}>
      {children}
    </GeotagImagesContext.Provider>
  );
};

export const useGeotagImagesContext = () => {
  const context = useContext(GeotagImagesContext);
  if (!context) {
    throw new Error(
      'useGeotagImagesContext must be used within a GeotagImagesProvider',
    );
  }
  return context;
};
