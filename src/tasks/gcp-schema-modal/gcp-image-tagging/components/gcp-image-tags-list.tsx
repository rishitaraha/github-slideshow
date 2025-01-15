import React from 'react';
import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Pill,
  PillVariant,
  Placement,
  Tooltip,
} from '@aus-platform/design-system';
import { GCPImageTagsListProps } from '../types';
import { GCPImageTagType } from 'src/shared/enums';

export const GCPImageTagsList: React.FC<GCPImageTagsListProps> = ({
  gcpRowData,
  imagesList,
  taggedImageIds,
  isRequestLoading,
  isLoadingMoreImages,
  onSelectImage,
  selectedImage,
  loadMore,
  onSubmit,
  displayUntagGcpModal,
  onCancelGCPTagging,
  isLoadingUntag,
}) => {
  return (
    <div className="gcp-image-list">
      <div className="gcp-image-list-header">
        <div className="gcp-image-list-header_row">
          <div className="gcp-image-list-label">{gcpRowData.label}</div>
          <div className="gcp-image-list-tagged">
            {taggedImageIds.size} tagged
          </div>
        </div>

        <div className="gcp-image-list-type">
          <Pill variant={PillVariant.Default} color={ColorClass.Neutral200}>
            {gcpRowData.type}
          </Pill>
        </div>
      </div>
      <div className="gcp-image-list-cards">
        {imagesList.map((image, index) => {
          return (
            <div
              className={
                selectedImage.imageId === image.imageId
                  ? 'gcp-image-list__card gcp-image-list__card__active'
                  : 'gcp-image-list__card'
              }
              key={image.imageFilename + index}
              onClick={() => onSelectImage(image)}
              tabIndex={0}
            >
              <div className="gcp-image-list__card-title">
                {image.imageFilename}
              </div>
              <img
                src={image.presignedUrl}
                alt={image.imageFilename}
                className="gcp-image-list__card-image"
                loading={'eager'}
              />
              {taggedImageIds.has(image.imageId) && (
                <div className="gcp-image-list__card-tagged">
                  <Tooltip
                    hoverText={'Image tagged'}
                    placement={Placement.Left}
                  >
                    <Icon
                      identifier={IconIdentifier.CheckCircle}
                      colorClass={ColorClass.White}
                      size={18}
                    />
                  </Tooltip>
                </div>
              )}
              {image.tagType === GCPImageTagType.ApproxTag && (
                <div className="gcp-image-list__card-smart-gcp">
                  <Tooltip
                    hoverText={'Smart GCP tag available'}
                    placement={Placement.Right}
                  >
                    <Icon
                      identifier={IconIdentifier.Alignment}
                      colorClass={ColorClass.White}
                      size={18}
                    />
                  </Tooltip>
                </div>
              )}
            </div>
          );
        })}
        <div className="gcp-image-list__load-more" onClick={loadMore}>
          {isLoadingMoreImages ? 'Loading...' : 'Load more images'}
        </div>
      </div>
      <div className="gcp-image-list__buttons">
        {taggedImageIds.size > 0 && (
          <Button
            variant={ButtonVariant.Secondary}
            onClick={displayUntagGcpModal}
            isLoading={isLoadingUntag}
          >
            <span className="gcp-image-list__buttons__untag-all">
              Untag All
            </span>
          </Button>
        )}
        <Button variant={ButtonVariant.Secondary} onClick={onCancelGCPTagging}>
          Cancel
        </Button>
        <Button onClick={onSubmit} isLoading={isRequestLoading}>
          Save
        </Button>
      </div>
    </div>
  );
};
