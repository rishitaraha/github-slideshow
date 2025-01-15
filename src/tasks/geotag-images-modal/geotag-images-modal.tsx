import { Modal } from 'react-bootstrap';
import {
  useGeotagImagesContext,
  useIterationDatasetContext,
} from '../contexts';
import { ViewGeotagGcpMapPreview } from '../view-geotag-gcp-map/view-geotag-gcp-map';
import { GeotagImagesModalView } from './enum';
import { GeotagImagesModalHeader } from './geotag-images-modal-header';
import { GeotagsImagePreview } from './geotag-images-preview';
import { GeotagImagesTable } from './geotag-images-table';
import { GeotagImagesModalProps } from './types';

export const GeotagImagesModal: React.FC<GeotagImagesModalProps> = ({
  onClose,
}) => {
  // Contexts.
  const { iterationDataset } = useIterationDatasetContext();
  const {
    modalPageView,
    actionSelectedGeotagImage,
    setActionSelectedGeotagImage,
    geotagImages,
    setModalPageView,
  } = useGeotagImagesContext();

  let geotagImageId = actionSelectedGeotagImage?.id;

  const onSelectMapPoint = (selectedId) => {
    const selectedImage = geotagImages.find((image) => image.id === selectedId);
    if (selectedImage) {
      setActionSelectedGeotagImage(selectedImage);
    }
    geotagImageId = selectedId;
    setModalPageView(GeotagImagesModalView.Image);
  };

  // Render.
  return (
    <Modal
      className="geotag-images-modal"
      dialogClassName="geotag-images-modal"
      onHide={onClose}
      centered
      show
      keyboard
    >
      <GeotagImagesModalHeader {...{ modalPageView }} />
      <Modal.Body className="geotag-images-modal__table">
        {modalPageView === GeotagImagesModalView.Table && <GeotagImagesTable />}
        {modalPageView === GeotagImagesModalView.Image && (
          <GeotagsImagePreview {...{ geotagImageId }} />
        )}
        {modalPageView === GeotagImagesModalView.Map && (
          <ViewGeotagGcpMapPreview
            dataset={iterationDataset}
            showGeotagImageActionButton={true}
            showGCPActionButton={false}
            onClickGeotagImagePoint={(e) => onSelectMapPoint(e)}
            onClickGCPImagePoint={() => {}}
          />
        )}
      </Modal.Body>
    </Modal>
  );
};
