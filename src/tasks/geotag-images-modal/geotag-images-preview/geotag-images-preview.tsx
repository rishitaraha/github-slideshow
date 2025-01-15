import {
  ColorClass,
  Icon,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import { useState, useRef, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { useGeotagImagesContext } from '..';
import { CarouselStep } from '../enum';
import { useGetGeotagImagePresignedUrlRequest } from 'src/shared/api';

enum ImagePreviewState {
  Loading = 'loading',
  Success = 'success',
  Error = 'error',
}

export const GeotagsImagePreview = ({ geotagImageId }) => {
  // Context.
  const { getSteppedGeotagImageItem } = useGeotagImagesContext();

  // States.
  const [geotagPresignedUrl, setGeotagPresignedUrl] = useState<string>();
  const [imagePreviewState, setImagePreviewState] = useState<ImagePreviewState>(
    ImagePreviewState.Loading,
  );
  const [flipImage, setFlipImage] = useState(false);

  // Ref.
  const imageRef = useRef<HTMLImageElement>(null);

  const {
    data: geotagImagePresignedUrlResponse,
    isSuccess: isSuccessGeotagImagePresignedUrlResponse,
    isPending: isLoadingGeotagImagePresignedUrlResponse,
    isError: isErrorGeotagImagePresignedUrlResponse,
  } = useGetGeotagImagePresignedUrlRequest({ id: geotagImageId });

  useEffect(() => {
    if (
      isSuccessGeotagImagePresignedUrlResponse &&
      geotagImagePresignedUrlResponse
    ) {
      setGeotagPresignedUrl(geotagImagePresignedUrlResponse.data.presignedUrl);
      setImagePreviewState(ImagePreviewState.Success);
    } else if (isLoadingGeotagImagePresignedUrlResponse) {
      setImagePreviewState(ImagePreviewState.Loading);
    } else if (isErrorGeotagImagePresignedUrlResponse) {
      setImagePreviewState(ImagePreviewState.Error);
    }
  }, [
    geotagImagePresignedUrlResponse,
    isSuccessGeotagImagePresignedUrlResponse,
    isLoadingGeotagImagePresignedUrlResponse,
    isErrorGeotagImagePresignedUrlResponse,
  ]);

  useEffect(() => {
    if (imageRef.current) {
      const isPortrait =
        imageRef.current.naturalHeight > imageRef.current.naturalWidth;
      setFlipImage(isPortrait);
    }
  }, [imageRef]);

  return (
    <Modal.Body>
      <div className="image-preview-body">
        <div
          className="image-preview-body__left-icon"
          onClick={() =>
            getSteppedGeotagImageItem(CarouselStep.Prev, geotagImageId)
          }
        >
          <Icon
            identifier={IconIdentifier.ArrowLeft}
            colorClass={ColorClass.Neutral300}
          />
        </div>

        {imagePreviewState === ImagePreviewState.Error && (
          <div className="d-flex flex-column justify-content-center align-items-center">
            <Icon
              identifier={IconIdentifier.WarningFill}
              colorClass={ColorClass.AccentWarning}
              size={54}
            />
            {isNil(geotagPresignedUrl)
              ? 'Image not uploaded.'
              : 'Error occurred'}
          </div>
        )}

        {imagePreviewState === ImagePreviewState.Loading && <Spinner />}
        {imagePreviewState === ImagePreviewState.Success && (
          <TransformWrapper
            initialScale={1}
            maxScale={200}
            minScale={0.2}
            wheel={{ step: 0.2 }}
            doubleClick={{ disabled: true }}
            zoomAnimation={{ animationType: 'linear' }}
            limitToBounds
            centerOnInit
          >
            {() => (
              <TransformComponent wrapperClass="geotag-image-preview__zoom-container">
                <div className="geotag-image-preview__zoom-container-image">
                  <img
                    className={
                      flipImage
                        ? 'image-preview-body__image-flip'
                        : 'image-preview-body__image'
                    }
                    src={geotagPresignedUrl}
                    onLoad={() =>
                      setImagePreviewState(ImagePreviewState.Success)
                    }
                    onError={() =>
                      setImagePreviewState(ImagePreviewState.Error)
                    }
                  />
                </div>
              </TransformComponent>
            )}
          </TransformWrapper>
        )}

        <div
          className="image-preview-body__right-icon"
          onClick={() => {
            getSteppedGeotagImageItem(CarouselStep.Next, geotagImageId);
          }}
        >
          <Icon
            identifier={IconIdentifier.ArrowRight}
            colorClass={ColorClass.Neutral300}
          />
        </div>
      </div>
    </Modal.Body>
  );
};
