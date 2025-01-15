import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  Spinner,
} from '@aus-platform/design-system';
import classNames from 'classnames';
import { isEmpty, isNil, isNull } from 'lodash';
import React, { FormEvent, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import {
  HeapCategory,
  HeapMaterialType,
  handleResponseMessage,
  useHeap,
  useUpdateHeap,
} from '../../../../../../../shared/api';
import {
  Formatter,
  preventNonNumber,
} from '../../../../../../../shared/helpers';
import { useInputFields } from '../../../../../../../shared/hooks';
import { heapCategoryOptions, heapMaterialOptions } from '../../constants';
import { editHeapValidator } from './edit-heap-validators';
import { EditHeapProps, InitialInputStateType } from './types';

const initialInputState: InitialInputStateType = {
  name: '',
  description: '',
  bulkDensity: null,
  category: {
    label: '',
    value: HeapCategory.Other,
  },
  materialType: {
    label: '',
    value: HeapMaterialType.Other,
  },
  includedInKpi: false,
};

export const EditHeap: React.FC<EditHeapProps> = ({
  onClose,
  heapId,
  refetchHeapList,
  show,
}) => {
  //Hooks.
  const {
    values,
    names,
    onBlur,
    onChange,
    setValues,
    onFocus,
    inputHasError,
    resetAll,
  } = useInputFields<InitialInputStateType>(
    initialInputState,
    editHeapValidator,
  );

  // Api's
  const {
    data: heapResponse,
    isSuccess: heapResponseIsSuccess,
    isInitialLoading: heapResponseIsLoading,
    refetch: refetchHeapResponse,
  } = useHeap(heapId, false);

  const {
    mutate: sendUpdateHeapRequest,
    data: heapUpdateResponse,
    isError: isErrorUpdateHeap,
    isSuccess: isSuccessUpdateHeap,
    error: updateHeapErrorResponse,
  } = useUpdateHeap();

  // useEffect's
  useEffect(() => {
    if (heapResponseIsSuccess && heapResponse) {
      const {
        name,
        remarks,
        bulkDensity,
        materialType,
        includedInKpi,
        category,
      } = heapResponse.data;
      setValues({
        name: name,
        description: remarks ?? '',
        bulkDensity: bulkDensity,
        materialType: {
          label: Formatter.toTitleCase(materialType),
          value: materialType,
        },
        category: {
          label: Formatter.toTitleCase(category, '_'),
          value: category,
        },
        includedInKpi: includedInKpi,
      });
    }
  }, [heapResponseIsSuccess]);

  useEffect(() => {
    if (heapId && show) {
      refetchHeapResponse();
    }
  }, [heapId, show]);

  useEffect(() => {
    if (isSuccessUpdateHeap && heapUpdateResponse) {
      handleResponseMessage(
        isSuccessUpdateHeap,
        isErrorUpdateHeap,
        heapUpdateResponse,
        updateHeapErrorResponse,
      );
      refetchHeapList();
      onCloseModal();
    }
  }, [isSuccessUpdateHeap, isErrorUpdateHeap]);

  // Conditional variables.
  const modalBodyCustomClass = classNames([
    heapResponseIsLoading ? 'modal-response-loading' : '',
  ]);

  //Handlers.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const {
      name,
      description,
      bulkDensity,
      includedInKpi,
      materialType,
      category,
    } = values;

    let weight;
    if (!isNil(bulkDensity) && heapResponse && heapResponse.data.cutVolume) {
      weight = (heapResponse.data.cutVolume * bulkDensity).toFixed(3);
    } else {
      weight = heapResponse?.data.cutWeight;
    }
    const remarks = isEmpty(description) ? null : description;
    sendUpdateHeapRequest({
      id: heapId,
      name: name,
      remarks: remarks,
      bulkDensity: bulkDensity,
      weight: weight,
      includedInKpi: includedInKpi,
      category: category.value,
      materialType: materialType.value,
    });
  };

  const onCloseModal = () => {
    resetAll();
    onClose();
    setValues(initialInputState);
  };

  return (
    <Modal
      className="edit-heap body-txt-3"
      contentClassName="w-40"
      show={show}
      centered
      aria-labelledby="contained-modal-title-hcenter"
      onHide={onCloseModal}
    >
      <Modal.Header closeButton> Edit Heap </Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body className={modalBodyCustomClass}>
          {heapResponseIsLoading ? (
            <Spinner />
          ) : (
            <>
              <InputGroup>
                <Input.Label> Name </Input.Label>
                <Input.Text
                  placeholder="Heap Name"
                  value={values.name}
                  name={names.name}
                  {...{ onChange, onBlur, onFocus }}
                />
              </InputGroup>
              <InputGroup>
                <Input.Label> Description </Input.Label>
                <Input.Text
                  placeholder="Heap Description"
                  value={values.description}
                  name={names.description}
                  maxLength={200}
                  {...{ onChange, onBlur, onFocus }}
                />
              </InputGroup>
              <InputGroup>
                <Input.Label> Bulk Density </Input.Label>
                <Input.Number
                  value={
                    isNull(values.bulkDensity) ? undefined : values.bulkDensity
                  }
                  placeholder="Bulk Density"
                  name={names.bulkDensity}
                  onKeyDown={preventNonNumber}
                  {...{ onChange, onBlur, onFocus }}
                />
              </InputGroup>
              <InputGroup className="modal__select">
                <Input.Label>Heap Material</Input.Label>
                <Input.Select
                  value={values.materialType}
                  placeholder="Heap Material"
                  name={names.materialType}
                  options={heapMaterialOptions}
                  onChange={(selectedMaterialType) => {
                    setValues({
                      ...values,
                      materialType: selectedMaterialType,
                    });
                  }}
                />
              </InputGroup>
              <InputGroup className="modal__select">
                <Input.Label>Heap Category</Input.Label>
                <Input.Select
                  value={values.category}
                  placeholder="Heap Category"
                  name={names.category}
                  options={heapCategoryOptions}
                  onChange={(selectedCategoryType) => {
                    setValues({
                      ...values,
                      category: selectedCategoryType,
                    });
                  }}
                />
              </InputGroup>
              {/*
              NOTE: This might get enabled again in the future. Temporarily Disabled for now.

              <InputGroup className="modal__checkbox">
                <CheckBoxCard
                  title="Include heap in KPI calculation"
                  checked={values.includedInKpi}
                  name={names.includedInKpi}
                  onClick={() => {
                    setValues({
                      ...values,
                      includedInKpi: !values.includedInKpi,
                    });
                  }}
                />
              </InputGroup> */}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div className="edit-heap__buttons">
            <Button variant={ButtonVariant.Secondary} onClick={onCloseModal}>
              Cancel
            </Button>
            <Button type="submit" disabled={inputHasError()}>
              Save
            </Button>
          </div>
        </Modal.Footer>
      </form>
    </Modal>
  );
};
