import {
  Button,
  ButtonVariant,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  toast,
} from '@aus-platform/design-system';
import { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { useGeotagImagesContext } from '../../contexts';
import {
  GeotagImageObj,
  handleResponseErrorMessage,
  usePatchGeotagImageRequest,
} from 'src/shared/api';
import { CoordinatesName } from 'src/shared/enums';
import { useInputFields } from 'src/shared/hooks';

export const EditGeotagsModal = () => {
  const {
    actionSelectedGeotagImage,
    setShowEditGeotagImagesModal,
    refetchGeotagImages,
    isCRSGeographic,
  } = useGeotagImagesContext();

  const [geotagImageDetails, setGeotagImageDetails] =
    useState<GeotagImageObj>();

  const geotagImageDetailsInitialState = {
    zCoordinate: 0,
    yCoordinate: 0,
    xCoordinate: 0,
    isCRSGeographic,
  };

  // Hooks.
  const {
    values,
    names,
    errors,
    dirty,
    onBlur,
    setValues,
    setErrors,
    inputHasError,
    onChange,
    onFocus,
  } = useInputFields(geotagImageDetailsInitialState);

  const {
    mutate: editGeotagDetails,
    data: editGeotagDetailsResponse,
    error: editGeotagDetailsErrorResponse,
    isSuccess: isSuccessEditGeotagDetails,
    isPending: isLoadingEditGeotagDetails,
    isError: isErrorEditGeotagDetails,
  } = usePatchGeotagImageRequest();

  // useEffects.
  useEffect(() => {
    if (actionSelectedGeotagImage) {
      const { zCoordinate, xCoordinate, yCoordinate } =
        actionSelectedGeotagImage;
      setValues({ ...values, zCoordinate, xCoordinate, yCoordinate });
      setGeotagImageDetails(actionSelectedGeotagImage);
    }
  }, []);

  useEffect(() => {
    if (isSuccessEditGeotagDetails && editGeotagDetailsResponse) {
      toast.success('Geotag/Image details updated successfully');
      refetchGeotagImages();
      onClose();
    }
    if (isErrorEditGeotagDetails) {
      handleResponseErrorMessage(
        isErrorEditGeotagDetails,
        editGeotagDetailsErrorResponse,
      );
    }
  }, [
    isSuccessEditGeotagDetails,
    editGeotagDetailsResponse,
    isErrorEditGeotagDetails,
  ]);

  // Handlers.
  const onClose = () => setShowEditGeotagImagesModal(false);

  const validInputCheck = () => {
    const charExistsRegex = /([A-Z])+/gi;
    for (const dirtyKey of Object.keys(dirty)) {
      if (dirty[dirtyKey]) {
        const dirtyValue = values[dirtyKey];
        if (dirtyValue.match(charExistsRegex)) {
          setErrors({ [dirtyKey]: 'Enter a valid number' });
          return false;
        }
      }
    }

    return true;
  };

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const isInputValid = validInputCheck();
    if (isInputValid && geotagImageDetails) {
      editGeotagDetails({
        geotagImageId: geotagImageDetails.id,
        xCoordinate: +values.xCoordinate,
        yCoordinate: +values.yCoordinate,
        zCoordinate: +values.zCoordinate,
      });
    }
  };

  return (
    <Modal
      className="geotag-edit-modal fade-scale"
      dialogClassName="geotag-edit-modal-dialog"
      show
      centered
      keyboard
      onHide={onClose}
      aria-labelledby="contained-modal-title-hcenter"
    >
      <Modal.Header>
        Edit Geotag
        <Icon identifier={IconIdentifier.Cross} onClick={onClose} cursor />
      </Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>
          {/* Latitude - Northing */}
          <InputGroup className="d-flex gap-4">
            <div className="d-flex flex-column">
              <Input.Label>Geotag Name</Input.Label>
              <Input.Text
                value={geotagImageDetails?.filename}
                disabled={true}
              />
            </div>
            <div className="d-flex flex-row gap-3">
              <div className="d-flex flex-column">
                <Input.Label>
                  {isCRSGeographic
                    ? CoordinatesName.Latitude
                    : CoordinatesName.Northing}
                </Input.Label>
                <Input.Number
                  placeholder={
                    isCRSGeographic
                      ? CoordinatesName.Latitude
                      : CoordinatesName.Northing
                  }
                  value={values.yCoordinate}
                  name={names.yCoordinate.toString()}
                  error={errors.yCoordinate}
                  isInvalid={!!errors.yCoordinate}
                  {...{ onChange, onBlur, onFocus }}
                />
              </div>
              <div className="d-flex flex-column">
                {/* Longitude - Easting */}
                <Input.Label>
                  {isCRSGeographic
                    ? CoordinatesName.Longitude
                    : CoordinatesName.Easting}
                </Input.Label>
                <Input.Number
                  placeholder={
                    isCRSGeographic
                      ? CoordinatesName.Longitude
                      : CoordinatesName.Easting
                  }
                  value={values.xCoordinate}
                  name={names.xCoordinate.toString()}
                  error={errors.xCoordinate}
                  isInvalid={!!errors.xCoordinate}
                  {...{ onChange, onBlur, onFocus }}
                />
              </div>
              <div className="d-flex flex-column">
                {/* Altitude */}
                <Input.Label>{CoordinatesName.Altitude} (m)</Input.Label>
                <Input.Number
                  placeholder={CoordinatesName.Altitude}
                  value={values.zCoordinate}
                  name={names.zCoordinate.toString()}
                  error={errors.zCoordinate}
                  isInvalid={!!errors.zCoordinate}
                  {...{ onChange, onBlur, onFocus }}
                />
              </div>
            </div>
          </InputGroup>
        </Modal.Body>
        <Modal.Footer className="gap-3">
          <Button variant={ButtonVariant.Secondary} onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            isLoading={isLoadingEditGeotagDetails}
            disabled={inputHasError()}
          >
            Save
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
