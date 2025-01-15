import React, { useEffect, useMemo, useState } from 'react';
import { isNil } from 'lodash';
import { Spinner, toast } from '@aus-platform/design-system';
import { Map, Set } from 'immutable';
import { GCPTagExitConfirmationModal } from './components/gcp-tag-exit-confimation-modal';
import { GCPUntagAllConfirmationModal } from './components/gcp-untag-all-confirmation-modal';
import { GCPImageTagPreview } from './components/gcp-image-tag-preview';
import { GCPImageTagsList } from './components/gcp-image-tags-list';
import { GCPImageTaggingModalProps } from './types';
import {
  ImageInfoObj,
  GCPImageTagData,
  useGcpImagesListRequest,
  useUpdateGcpTags,
  useDeleteGcpImageTags,
} from 'src/shared/api';
import { GCPImageTagType } from 'src/shared/enums';

export const GCPImageTaggingModal: React.FC<GCPImageTaggingModalProps> = ({
  gcpRowData,
  onDoneCallback,
  showGCPExitConfirmationModal,
  hideExitConfirmationModal,
  displayExitConfirmationModal,
  setHasUnsavedGcpTagChanges,
}) => {
  // Constants
  const pageSize = 8;

  //States.
  const [imagesPageNumber, setImagesPageNumber] = useState<number>(0);
  const [showUntagGcpModal, setShowUntagGcpModal] = useState(false);
  const [imagesList, setImagesList] = useState<ImageInfoObj[]>([]);
  const [selectedImage, setSelectedImage] = useState<ImageInfoObj>();
  const [taggedImagesData, setTaggedImagesData] =
    useState<Map<string, GCPImageTagData>>(Map());
  const [taggedImageIds, setTaggedImageIds] = useState<Set<string>>(Set());

  // Api.
  const {
    data: imageListNearGcp,
    isSuccess: isSuccessGcpImageListRequest,
    isPending: isLoadingGcpImageListRequest,
    refetch: refetchGcpImagesList,
  } = useGcpImagesListRequest({
    gcpId: gcpRowData.id,
    pageNumber: imagesPageNumber,
    pageSize,
  });

  const {
    mutate: sendGcpTaggedImagesUpdateRequest,
    data: gcpTaggedImageUpdateDataResponse,
    isSuccess: isSuccessGcpTaggedImageUpdateRequest,
    isPending: isLoadingGcpTaggedImageUpdate,
    isError: isErrorGcpTaggedImageUpdate,
  } = useUpdateGcpTags();

  const {
    mutate: sendUntagGcpImagesRequest,
    isSuccess: isSuccessUntagGcpImagesRequest,
    isPending: isLoadingUntagGcpImagesRequest,
    isError: isErrorUntagGcpImagesRequest,
  } = useDeleteGcpImageTags();

  // useEffects.
  useEffect(() => {
    if (isSuccessGcpImageListRequest && !isNil(imageListNearGcp)) {
      const imageListObj = imageListNearGcp.images;
      if (imagesPageNumber === 0) {
        setImagesList(imageListObj);
        setSelectedImage(imageListObj[0]);
      } else {
        setImagesList((prevList) => prevList.concat(imageListObj));
      }
      setTaggedImageIds((prev) =>
        prev.concat(
          imageListObj
            .filter((image) => image.tagType === GCPImageTagType.Tagged)
            .map((image) => image.imageId),
        ),
      );
    }
  }, [isSuccessGcpImageListRequest, imagesPageNumber]);

  useEffect(() => {
    if (
      isSuccessGcpTaggedImageUpdateRequest &&
      gcpTaggedImageUpdateDataResponse
    ) {
      toast.success('GCP image tags updated successfully');
      handleExitGCPImageViewer();
    }
    if (isErrorGcpTaggedImageUpdate) {
      toast.error('Error in updating GCP image tags');
    }
  }, [
    gcpTaggedImageUpdateDataResponse,
    isSuccessGcpTaggedImageUpdateRequest,
    isErrorGcpTaggedImageUpdate,
  ]);

  useEffect(() => {
    if (isSuccessUntagGcpImagesRequest) {
      toast.success('Untagged all GCP image tags');
      closeUntagGcpModal();
      refetchGcpImagesList();
    }
    if (isErrorGcpTaggedImageUpdate) {
      toast.error('Error occurred to untag all GCP image tags');
    }
  }, [isSuccessUntagGcpImagesRequest, isErrorUntagGcpImagesRequest]);

  // useMemo.
  const taggedData = useMemo(
    () => selectedImage && taggedImagesData.get(selectedImage.imageId),
    [selectedImage, taggedImagesData],
  );

  //Handlers.
  const displayUntagGcpModal = () => setShowUntagGcpModal(true);
  const closeUntagGcpModal = () => setShowUntagGcpModal(false);

  const onSelectImage = (imageSelected: ImageInfoObj): void =>
    setSelectedImage(imageSelected);

  const onTagImage = (imageData: GCPImageTagData) => {
    setTaggedImagesData((prev) => prev.set(imageData.imageId, imageData));
    setTaggedImageIds((prev) => prev.add(imageData.imageId));
    setHasUnsavedGcpTagChanges(true);
  };

  const onRemoveTag = (imageData: ImageInfoObj) => {
    const taggedImage = imagesList.find(
      (image) =>
        image.imageId === imageData.imageId &&
        image.tagType === GCPImageTagType.Tagged,
    );
    if (taggedImage) {
      setTaggedImagesData((prev) =>
        prev.set(imageData.imageId, {
          imageId: taggedImage.imageId,
          imageX: taggedImage.imageX,
          imageY: taggedImage.imageY,
          isDeleted: true,
        }),
      );
    } else {
      setTaggedImagesData((prev) => prev.delete(imageData.imageId));
    }
    setHasUnsavedGcpTagChanges(true);
    setTaggedImageIds((prev) => prev.delete(imageData.imageId));
  };

  const loadMore = () => {
    setImagesPageNumber((prev) => prev + 1);
  };

  const onSubmit = () => {
    if (taggedImagesData.size > 0) {
      sendGcpTaggedImagesUpdateRequest({
        gcp: gcpRowData.id,
        gcpImageTags: [...taggedImagesData.values()],
      });
    } else {
      handleExitGCPImageViewer();
    }
    setHasUnsavedGcpTagChanges(false);
  };

  const onUntagAllGcpDetailsSubmit = () => {
    sendUntagGcpImagesRequest({ gcpId: gcpRowData.id });
    setTaggedImagesData(Map());
    setTaggedImageIds(Set());
  };

  const handleExitGCPImageViewer = () => {
    closeUntagGcpModal();
    hideExitConfirmationModal();
    onDoneCallback();
    setHasUnsavedGcpTagChanges(false);
  };

  const onCancelGCPTagging = () => {
    if (taggedImagesData.size > 0) {
      displayExitConfirmationModal();
    } else {
      onDoneCallback();
    }
  };

  return (
    <div className="gcp-image-tagging">
      {isLoadingGcpImageListRequest ? (
        <Spinner />
      ) : (
        selectedImage && (
          <>
            <GCPImageTagsList
              {...{
                gcpRowData,
                imagesList,
                selectedImage,
                taggedImageIds,
                onSelectImage,
                loadMore,
                onSubmit,
                onCancelGCPTagging,
                displayUntagGcpModal,
                isRequestLoading: isLoadingGcpTaggedImageUpdate,
                isLoadingMoreImages: isLoadingGcpImageListRequest,
                isLoadingUntag: isLoadingUntagGcpImagesRequest,
              }}
            />
            <GCPImageTagPreview
              {...{
                selectedImage,
                taggedImageIds,
                onTagImage,
                onRemoveTag,
                taggedData,
              }}
            />
            <GCPUntagAllConfirmationModal
              show={showUntagGcpModal}
              isLoadingUntagGcp={isLoadingGcpTaggedImageUpdate}
              onClose={closeUntagGcpModal}
              onUntagGcp={onUntagAllGcpDetailsSubmit}
              gcpName={gcpRowData.label}
              gcpType={gcpRowData.type}
            />
            <GCPTagExitConfirmationModal
              show={showGCPExitConfirmationModal}
              onHide={hideExitConfirmationModal}
              handleExitWithoutSaving={handleExitGCPImageViewer}
              handleExitAndSave={onSubmit}
            />
          </>
        )
      )}
    </div>
  );
};
