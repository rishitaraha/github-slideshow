import React, { useRef } from 'react';
import {
  ReactZoomPanPinchRef,
  TransformComponent,
  TransformWrapper,
} from 'react-zoom-pan-pinch';
import {
  Button,
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
  Tooltip,
} from '@aus-platform/design-system';
import {
  ExifOrientationNumber,
  ExifOrientationNumberToTypeMapping,
} from '../../../constants';
import { GCPImageTagPreviewProps } from '../types';

import {
  RotationalTransformValuesFromScreenImageToStorageImage,
  RotationalTransformValuesFromStorageImageToScreenImage,
} from '../helpers';
import { GCPImageTagType } from 'src/shared/enums';

export const GCPImageTagPreview: React.FC<GCPImageTagPreviewProps> = ({
  selectedImage,
  taggedImageIds,
  taggedData,
  onTagImage,
  onRemoveTag,
}) => {
  // Refs.
  const ImageContainerRef = useRef<HTMLDivElement>(null);
  const TransformComponentRef = useRef<ReactZoomPanPinchRef>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Constants.
  const imageOrientation =
    ExifOrientationNumberToTypeMapping[selectedImage.imageOrientation] ??
    ExifOrientationNumber.One;

  // Handlers.
  const imageTagClickHandler = () => {
    // Parameters required for calculating coordinates.
    const containerHeight = ImageContainerRef.current?.clientHeight;
    const containerWidth = ImageContainerRef.current?.clientWidth;

    const imageHeight = imageRef.current?.naturalHeight ?? 0;
    const imageWidth = imageRef.current?.naturalWidth ?? 0;

    const { current } = TransformComponentRef;

    const translateX = current?.state.positionX;
    const translateY = current?.state.positionY;

    const scale = current?.state.scale;

    const xAxisTagCoordinate =
      ((containerWidth ?? 0) / 2 - (translateX ?? 0)) / (scale ?? 1);
    const yAxisTagCoordinate =
      ((containerHeight ?? 0) / 2 - (translateY ?? 0)) / (scale ?? 1);

    const { xUpdated, yUpdated } =
      RotationalTransformValuesFromScreenImageToStorageImage(
        imageOrientation,
        imageWidth,
        imageHeight,
        xAxisTagCoordinate,
        yAxisTagCoordinate,
      );

    if (xAxisTagCoordinate > 0 && yAxisTagCoordinate > 0) {
      onTagImage({
        imageId: selectedImage.imageId,
        imageX: Number.parseFloat(xUpdated.toFixed(2)),
        imageY: Number.parseFloat(yUpdated.toFixed(2)),
      });
    }
  };

  const preTaggedImageCoordinateHandler = (
    xAxisTagCoordinate: number,
    yAxisTagCoordinate: number,
    zoomLevel?: number,
  ) => {
    const containerHeight = ImageContainerRef.current?.clientHeight;
    const containerWidth = ImageContainerRef.current?.clientWidth;

    const imageHeight = imageRef.current?.naturalHeight ?? 0;
    const imageWidth = imageRef.current?.naturalWidth ?? 0;

    // Handling previously tagged image.
    if (containerWidth && containerHeight) {
      const { xUpdated, yUpdated } =
        RotationalTransformValuesFromStorageImageToScreenImage(
          imageOrientation,
          imageWidth,
          imageHeight,
          xAxisTagCoordinate,
          yAxisTagCoordinate,
        );

      const scale =
        (zoomLevel || TransformComponentRef.current?.state.scale) ?? 4;

      const preTaggedTranslateX = containerWidth * 0.5 - xUpdated * scale;
      const preTaggedTranslateY = containerHeight * 0.5 - yUpdated * scale;

      TransformComponentRef.current?.setTransform(
        preTaggedTranslateX,
        preTaggedTranslateY,
        scale,
        800,
        'easeOut',
      );
    }
  };

  const isImageTagged = taggedImageIds.has(selectedImage.imageId);

  const resetZoomHandler = () => {
    TransformComponentRef.current?.centerView(0.2);
  };

  const panToGcpHandler = () => {
    if (taggedData && !taggedData.isDeleted) {
      const { imageX, imageY } = taggedData;
      preTaggedImageCoordinateHandler(imageX, imageY, 4);
    } else if (selectedImage.tagType !== GCPImageTagType.Untagged) {
      const { imageX, imageY } = selectedImage;
      preTaggedImageCoordinateHandler(imageX, imageY, 4);
    } else {
      resetZoomHandler();
    }
  };

  return (
    <div className="gcp-image-preview" ref={ImageContainerRef}>
      <TransformWrapper
        initialScale={1}
        maxScale={200}
        minScale={0.15}
        wheel={{ step: 0.1 }}
        doubleClick={{ disabled: true }}
        zoomAnimation={{ animationType: 'linear' }}
        limitToBounds={false}
        ref={TransformComponentRef}
        centerOnInit={true}
      >
        {() => (
          <>
            <TransformComponent wrapperClass="gcp-image-preview__zoom-container">
              <div className="gcp-image-preview__zoom-container-image">
                <img
                  src={selectedImage.presignedUrl}
                  loading="eager"
                  ref={imageRef}
                  onLoad={panToGcpHandler}
                />
              </div>
            </TransformComponent>
            <div className="gcp-image-preview__crosshair">
              <Icon
                size={100}
                identifier={IconIdentifier.GCPCrosshairImageViewer}
                colorClass={
                  isImageTagged
                    ? ColorClass.AccentSuccess
                    : ColorClass.AccentError
                }
              />
            </div>
            {isImageTagged ? (
              <Button
                variant={ButtonVariant.Secondary}
                className="gcp-image-preview__image-top-btn gcp-image-preview__image-icon-bin"
                onClick={() => onRemoveTag(selectedImage)}
              >
                <Icon
                  identifier={IconIdentifier.Bin}
                  colorClass={ColorClass.White}
                  size={24}
                />
              </Button>
            ) : (
              <Button
                variant={ButtonVariant.Secondary}
                className="gcp-image-preview__image-top-btn gcp-image-preview__image-icon-pin"
                onClick={imageTagClickHandler}
              >
                <Icon
                  identifier={IconIdentifier.Pin}
                  colorClass={ColorClass.White}
                  size={18}
                />
              </Button>
            )}
            {isImageTagged && (
              <div className="gcp-image-preview__image-buttons">
                <Tooltip hoverText={'Re-center'}>
                  <Button
                    variant={ButtonVariant.Secondary}
                    className="gcp-image-preview__image-button gcp-image-preview__image-icon-reset"
                    onClick={panToGcpHandler}
                  >
                    <Icon
                      identifier={IconIdentifier.Reset}
                      colorClass={ColorClass.White}
                      size={20}
                    />
                  </Button>
                </Tooltip>
              </div>
            )}
          </>
        )}
      </TransformWrapper>
    </div>
  );
};
