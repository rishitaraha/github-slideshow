import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

import {
  ColorClass,
  IconButton,
  IconButtonVariant,
  IconIdentifier,
  Spinner,
} from '@aus-platform/design-system';
import { isNull } from 'lodash';

type ImagePreviewModalProps = {
  show: boolean;
  source: string;
  title: string;
  onClose: () => void;
  onClickPreviousImage: () => void;
  onClickNextImage: () => void;
  isLoading?: boolean;
  onImageLoadSuccess?: () => void;
  onImageLoadError?: () => void;
};

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  show,
  source,
  title,
  onClose,
  onClickPreviousImage,
  onClickNextImage,
  isLoading = false,
  onImageLoadSuccess = () => {},
  onImageLoadError = () => {},
}) => {
  // States.
  const [isImageLoading, setIsImageLoading] = useState(false);

  // UseEffect - source.
  useEffect(() => {
    if (!isNull(source)) {
      setIsImageLoading(true);
    }
  }, [source]);

  // Handlers.
  const onImageLoadSuccessHandler = () => {
    setIsImageLoading(false);

    onImageLoadSuccess();
  };

  // Renders.
  const renderImagePreviewer = () => (
    <TransformWrapper
      initialScale={1}
      maxScale={10}
      minScale={1}
      wheel={{ step: 0.1 }}
      zoomAnimation={{ animationType: 'linear' }}
      limitToBounds
      centerOnInit
      centerZoomedOut
    >
      <TransformComponent
        wrapperClass="image-preview-modal__body__previewer__wrapper"
        contentClass="image-preview-modal__body__previewer__component"
      >
        <img
          className="image-preview-modal__body__previewer__image"
          src={source}
          onLoad={onImageLoadSuccessHandler}
          onError={onImageLoadError}
          // Remove previous image on source change.
          style={{ display: isLoading || isImageLoading ? 'none' : 'block' }}
        />
        {isLoading ||
          (isImageLoading && (
            <Spinner className="image-preview-modal__body__previewer__spinner" />
          ))}
      </TransformComponent>
    </TransformWrapper>
  );

  return (
    <Modal
      className={`image-preview-modal body-txt-3`}
      contentClassName={'image-preview-modal__content'}
      dialogClassName={'image-preview-modal__dialog'}
      show={show}
      centered
      keyboard={true}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>
        <div className="image-preview-modal__header__title">{title}</div>
        <IconButton
          iconIdentifier={IconIdentifier.Cross}
          variant={IconButtonVariant.Secondary}
          iconProps={{ colorClass: ColorClass.Neutral300 }}
          className="btn m-0 p-0"
          onClick={onClose}
        />
      </Modal.Header>
      <Modal.Body className="image-preview-modal__body">
        <IconButton
          className="image-preview-modal__body__icon-button--previous"
          variant={IconButtonVariant.Secondary}
          iconIdentifier={IconIdentifier.ArrowLeft}
          iconProps={{ colorClass: ColorClass.Gray850 }}
          onClick={onClickPreviousImage}
        />
        {renderImagePreviewer()}
        <IconButton
          className="image-preview-modal__body__icon-button--next"
          variant={IconButtonVariant.Secondary}
          iconIdentifier={IconIdentifier.ArrowRight}
          iconProps={{ colorClass: ColorClass.Gray850 }}
          onClick={onClickNextImage}
        />
      </Modal.Body>
    </Modal>
  );
};
