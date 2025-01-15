import { Button, ButtonVariant, Input } from '@aus-platform/design-system';
import { FC, useEffect } from 'react';
import { InputGroup, Modal } from 'react-bootstrap';
import { GCPEditModalInput, GCPEditModalProps } from './types';
import { useInputFields } from 'shared/hooks';
import { CoordinatesName } from 'src/shared/enums';
import { editCoordinatesValidator } from 'src/shared/helpers/edit-coordinates-validator';

const gcpEditModalInitialState: GCPEditModalInput = {
  name: '',
  xCoordinate: '0',
  yCoordinate: '0',
  zCoordinate: '0',
  isCRSGeographic: true,
};

export const GCPEditModal: FC<GCPEditModalProps> = ({
  show,
  close,
  currentRow,
  isCRSGeographic,
  gcpUpdateQuery,
}) => {
  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputIsDirty,
    inputHasError,
    resetAll,
  } = useInputFields<GCPEditModalInput>(
    gcpEditModalInitialState,
    editCoordinatesValidator,
  );

  // Constants.
  const { sendGCPUpdateRequest, isPendingGCPUpdate } = gcpUpdateQuery;

  const xLabel = isCRSGeographic
    ? CoordinatesName.Longitude
    : CoordinatesName.Easting;
  const yLabel = isCRSGeographic
    ? CoordinatesName.Latitude
    : CoordinatesName.Northing;

  // useEffect.
  useEffect(() => {
    if (show && currentRow) {
      setValues({
        name: currentRow.label,
        xCoordinate: currentRow.xCoordinate.toString(),
        yCoordinate: currentRow.yCoordinate.toString(),
        zCoordinate: currentRow.zCoordinate.toString(),
        isCRSGeographic,
      });
    }
  }, [show]);

  // Handlers.
  const onSubmit = (event: React.FormEvent) => {
    event.stopPropagation();

    const payload = {
      label: values.name,
      xCoordinate: +values.xCoordinate,
      yCoordinate: +values.yCoordinate,
      zCoordinate: +values.zCoordinate,
    };

    sendGCPUpdateRequest({ id: currentRow.id, body: payload });
  };

  const handleOnClose = () => {
    close();
    resetAll();
  };

  return (
    <Modal
      show={show}
      onHide={handleOnClose}
      className="gcp-edit-modal__container"
      contentClassName="gcp-edit-modal__content"
      keyboard
      centered
    >
      <Modal.Header closeButton>Edit GCP</Modal.Header>
      <Modal.Body>
        <InputGroup className="gcp-edit-modal__input-container">
          <InputGroup className="gcp-edit-modal__input-group">
            <Input.Label>GCP Name</Input.Label>
            <Input.Text
              value={values.name}
              name={names.name}
              error={errors.name}
              isInvalid={!!errors.name}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
          <InputGroup className="gcp-edit-modal__input-coordinates">
            <InputGroup className="gcp-edit-modal__input-group">
              <Input.Label>{yLabel}</Input.Label>
              <Input.Text
                value={values.yCoordinate}
                name={names.yCoordinate}
                error={errors.yCoordinate}
                isInvalid={!!errors.yCoordinate}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup className="gcp-edit-modal__input-group">
              <Input.Label>{xLabel}</Input.Label>
              <Input.Text
                value={values.xCoordinate}
                name={names.xCoordinate}
                error={errors.xCoordinate}
                isInvalid={!!errors.xCoordinate}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup className="gcp-edit-modal__input-group">
              <Input.Label>Altitude (m)</Input.Label>
              <Input.Text
                value={values.zCoordinate}
                name={names.zCoordinate}
                error={errors.zCoordinate}
                isInvalid={!!errors.zCoordinate}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </InputGroup>
        </InputGroup>
      </Modal.Body>
      <Modal.Footer>
        <InputGroup className="gcp-edit-modal__input-btns">
          <Button variant={ButtonVariant.Secondary} onClick={handleOnClose}>
            Cancel
          </Button>
          <Button
            isLoading={isPendingGCPUpdate}
            disabled={!inputIsDirty() || inputHasError()}
            onClick={onSubmit}
            type="submit"
          >
            Save
          </Button>
        </InputGroup>
      </Modal.Footer>
    </Modal>
  );
};
