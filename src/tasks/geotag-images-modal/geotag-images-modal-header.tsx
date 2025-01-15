import {
  ButtonVariant,
  ColorClass,
  Icon,
  IconIdentifier,
} from '@aus-platform/design-system';
import { Button, Modal } from 'react-bootstrap';
import { useGeotagImagesContext } from '../contexts';
import { GeotagImagesModalView } from './enum';

export const GeotagImagesModalHeader = ({ modalPageView }) => {
  const { actionSelectedGeotagImage, setModalPageView } =
    useGeotagImagesContext();

  return (
    <Modal.Header className="geotag-images-modal__header" closeButton>
      <div className="geotags-modal__header--left d-flex">
        {modalPageView !== GeotagImagesModalView.Table && (
          <div className="">
            <Button variant={ButtonVariant.Link}>
              <Icon
                className="geotags-modal__icon mr-5 cursor"
                identifier={IconIdentifier.ArrowLeft}
                colorClass={ColorClass.Neutral300}
                onClick={() => {
                  setModalPageView(GeotagImagesModalView.Table);
                }}
              />
            </Button>
          </div>
        )}
        <div className="align-content-center">
          {modalPageView === GeotagImagesModalView.Image &&
            (actionSelectedGeotagImage?.filename ?? 'Geotag Image Preview')}
          {modalPageView === GeotagImagesModalView.Map && 'Geotag Map View'}
          {modalPageView === GeotagImagesModalView.Table && 'Geotag Images'}
        </div>
      </div>
    </Modal.Header>
  );
};
