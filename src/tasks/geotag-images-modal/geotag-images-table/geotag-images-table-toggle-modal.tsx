import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
  TabSwitcher,
  toast,
} from '@aus-platform/design-system';
import { useEffect, useState } from 'react';

import { Modal } from 'react-bootstrap';
import { useGeotagImagesContext } from '../../contexts';
import {
  handleResponseSuccessMessage,
  usePatchBulkGeotagImageRequest,
} from 'src/shared/api';

enum GeotagImageValues {
  Images = 'Images',
  Geotags = 'Geotags',
}

export const ToggleImagesGeotagsModal = () => {
  const [selectedTabKey, setSelectedTabKey] = useState<GeotagImageValues>(
    GeotagImageValues.Images,
  );
  const [enableImages, setEnableImages] = useState(true);
  const [enableGeotags, setEnableGeotags] = useState(true);

  const {
    iterationDataset,
    setShowToggleGeotagImagesModal,
    rowSelection,
    refetchGeotagImages,
  } = useGeotagImagesContext();

  const geotagImagesSelected = Object.keys(rowSelection); // Collect selected image IDs

  const itemSelectedCount = geotagImagesSelected.length;

  const {
    mutate: editBulkGeotagDetails,
    data: editBulkGeotagDetailsResponse,
    error: editBulkGeotagDetailsErrorResponse,
    isSuccess: isSuccessBulkEditGeotagDetails,
    isPending: isLoadingBulkEditGeotagDetails,
    isError: isErrorBulkEditGeotagDetails,
  } = usePatchBulkGeotagImageRequest();

  // useEffect.
  useEffect(() => {
    if (isSuccessBulkEditGeotagDetails && editBulkGeotagDetailsResponse) {
      refetchGeotagImages();
      handleResponseSuccessMessage(
        isSuccessBulkEditGeotagDetails,
        editBulkGeotagDetailsResponse,
      );
      onClose();
    }
    if (isErrorBulkEditGeotagDetails && editBulkGeotagDetailsErrorResponse) {
      toast.error('Error updating geotag images');
    }
  }, [
    isSuccessBulkEditGeotagDetails,
    editBulkGeotagDetailsResponse,
    editBulkGeotagDetailsErrorResponse,
    isErrorBulkEditGeotagDetails,
  ]);

  const handleTabChange = (tabKey) => setSelectedTabKey(tabKey);
  const toggleState = (setState) => () => setState((prev) => !prev);

  const handleSubmit = () => {
    editBulkGeotagDetails({
      iterationDataset: iterationDataset.id,
      geotagImageIds: geotagImagesSelected,
      isGeotagDisabled: !enableGeotags,
      isImageDisabled: !enableImages,
    });
  };

  const onClose = () => setShowToggleGeotagImagesModal(false);

  const SelectionBody = ({ itemType, enabled, toggle }) => (
    <div className="geotag-toggle-modal__body">
      <div className="geotag-toggle-modal__body-neutral">
        {itemSelectedCount} items selected
      </div>
      <div className="geotag-toggle-modal__body-radio">
        <input type="radio" checked={enabled} onChange={toggle} />
        Enable selected {itemType}
      </div>
      <div className="geotag-toggle-modal__body-radio">
        <input type="radio" checked={!enabled} onChange={toggle} />
        Disable selected {itemType}
      </div>
      <div className="login-card__warning d-flex">
        <Icon identifier={IconIdentifier.Warning} size={18} />
        Disabled {itemType} will not be considered for processing
      </div>
    </div>
  );

  const tabs = [
    {
      label: GeotagImageValues.Images,
      children: (
        <SelectionBody
          itemType={GeotagImageValues.Images}
          enabled={enableImages}
          toggle={toggleState(setEnableImages)}
        />
      ),
      key: GeotagImageValues.Images,
    },
    {
      label: GeotagImageValues.Geotags,
      children: (
        <SelectionBody
          itemType={GeotagImageValues.Geotags}
          enabled={enableGeotags}
          toggle={toggleState(setEnableGeotags)}
        />
      ),
      key: GeotagImageValues.Geotags,
    },
  ];

  return (
    <Modal
      className="geotag-toggle-modal fade-scale"
      dialogClassName="geotag-toggle-modal-dialog"
      show
      centered
      keyboard
      onHide={onClose}
      closeButton
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header closeButton>Toggle Images / Geotags</Modal.Header>
      <Modal.Body>
        <TabSwitcher
          defaultActiveKey={GeotagImageValues.Images}
          activeKey={selectedTabKey}
          tabComponentList={tabs}
          onTabSwitch={handleTabChange}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant={ButtonVariant.Secondary} onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={ButtonVariant.Primary}
          className="geotag-toggle-modal__cancel"
          isLoading={isLoadingBulkEditGeotagDetails}
          onClick={handleSubmit}
        >
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
