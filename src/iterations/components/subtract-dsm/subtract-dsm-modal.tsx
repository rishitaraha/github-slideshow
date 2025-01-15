import {
  Button,
  ButtonVariant,
  FormMessage,
  FormMessageVariant,
  Input,
  InputGroup,
  SelectOption,
} from '@aus-platform/design-system';
import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import { isEmpty, isNil } from 'lodash';
import {
  LayerType,
  SubtractDsmPayload,
  handleResponseMessage,
  useIterationsList,
  useLayerList,
  useSubtractDsm,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { preventNonNumber } from '../../../shared/helpers';
import { SubtractDsmInput, SubtractDsmModalProps } from './type';

const subtractDsmInitialInputState: SubtractDsmInput = {
  iterationName: '',
  date: new Date().toISOString().slice(0, 10),
  firstIteration: null,
  secondIteration: null,
  thresholdValue: 0,
  iterationForOrtho: null,
  orthoLayers: null,
};

export const SubtractDsmModal: React.FC<SubtractDsmModalProps> = ({
  show,
  onClose,
  siteId,
  refetchIterationFn,
  ...rest
}) => {
  // Hooks.
  const {
    values,
    names,
    errors,
    onChange,
    onBlur,
    onFocus,
    setValues,
    inputHasError,
    resetAll,
  } = useInputFields<SubtractDsmInput>(subtractDsmInitialInputState);

  // States.
  const [iterationOptions, setIterationOptions] = useState<SelectOption[]>();
  const [layerListOptions, setLayerListOptions] = useState<SelectOption[]>();

  // Constants.
  const firstIterationOptions = iterationOptions?.filter(
    (iteration) => iteration != values.secondIteration,
  );
  const secondIterationOptions = iterationOptions?.filter(
    (iteration) => iteration != values.firstIteration,
  );

  // APIs.
  const {
    data: iterationListResponse,
    isLoading: isLoadingIterationList,
    isSuccess: isSuccessIterationList,
  } = useIterationsList(
    {
      siteId: siteId,
    },
    show,
  );

  const {
    mutate: sendSubtractDsmRequest,
    isSuccess: isSuccessSubtractDsm,
    data: subtractDsmData,
    isError: isErrorSubtractDsm,
    isPending: isLoadingSubtractDsm,
    error: subtractDsmError,
  } = useSubtractDsm();

  const {
    data: layerListResponse,
    isSuccess: isSuccessLayerList,
    isLoading: isLoadingLayerList,
  } = useLayerList(
    {
      iterationId: values.iterationForOrtho?.value ?? '',
      includeFields: ['id', 'name', 'type'],
    },
    !isNil(values.iterationForOrtho) &&
      !isEmpty(values.iterationForOrtho.value),
  );

  //  useEffects.
  useEffect(() => {
    if (isSuccessIterationList && iterationListResponse) {
      const iterations = iterationListResponse.list.map((iteration) => {
        return {
          label: iteration.name,
          value: iteration.id,
        };
      });
      setIterationOptions(iterations);
    }
  }, [isSuccessIterationList, iterationListResponse]);

  useEffect(() => {
    if (isSuccessLayerList && layerListResponse) {
      const layers = layerListResponse.list
        .filter(({ type }) => type === LayerType.Orthomosaic)
        .map((layer) => {
          return {
            label: layer.name,
            value: layer.id,
          };
        });
      setLayerListOptions(layers);
    }
  }, [isSuccessLayerList, layerListResponse]);

  useEffect(() => {
    if (isSuccessSubtractDsm && subtractDsmData) {
      onClose();
      resetAll();
      setValues(subtractDsmInitialInputState);
      setLayerListOptions(undefined);
      refetchIterationFn();
    }

    handleResponseMessage(
      isSuccessSubtractDsm,
      isErrorSubtractDsm,
      subtractDsmData,
      subtractDsmError,
    );
  }, [isSuccessSubtractDsm, isErrorSubtractDsm]);

  // Handlers.
  const onCancelBtnClick = () => {
    onClose();
    resetAll();
    setValues(subtractDsmInitialInputState);
    setLayerListOptions(undefined);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!inputHasError()) {
      const payload: SubtractDsmPayload = {
        newIterationName: values.iterationName,
        date: values.date,
        firstIteration: values.firstIteration?.value ?? '',
        secondIteration: values.secondIteration?.value ?? '',
        thresholdValue: values.thresholdValue,
        copyOrthoFromIteration: values.iterationForOrtho?.value ?? '',
        orthoLayer: values.orthoLayers?.value ?? '',
      };

      sendSubtractDsmRequest(payload);
    }
  };

  return (
    <Modal
      {...rest}
      show={show}
      onHide={onCancelBtnClick}
      size="sm"
      backdrop="static"
      dialogClassName="subtract-dsm"
      restoreFocus={false}
      centered
    >
      <Modal.Header closeButton>DSM Subtraction</Modal.Header>
      <Modal.Body className="subtract-dsm__form">
        <FormMessage
          className="subtract-dsm__form-message"
          message="Subtracted DSM will be exported to a new iteration"
          variant={FormMessageVariant.Info}
          showIcon
        />

        <div className="subtract-dsm__form__input-container">
          <InputGroup className="subtract-dsm__form__input-container__iteration-name">
            <Input.Label isRequired>New Iteration Name</Input.Label>
            <Input.Text
              placeholder="Enter name"
              value={values.iterationName}
              name={names.iterationName}
              error={errors.iterationName}
              isInvalid={!!errors.iterationName}
              disabled={isLoadingSubtractDsm}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>

          <InputGroup className="subtract-dsm__form__input-container__date">
            <Input.Label isRequired>Date</Input.Label>
            <Input.Date
              value={values.date}
              name={names.date}
              error={errors.date}
              isInvalid={!!errors.date}
              disabled={isLoadingSubtractDsm}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </div>

        <div className="subtract-dsm__form__input-container">
          <InputGroup>
            <Input.Label isRequired>Select First Iteration</Input.Label>
            <Input.Select
              value={values.firstIteration}
              name={names.firstIteration}
              error={errors.firstIteration}
              options={firstIterationOptions}
              onChange={(selectedOption) =>
                setValues({ ...values, firstIteration: selectedOption })
              }
              isDisabled={isLoadingSubtractDsm}
              {...{ onBlur, onFocus }}
            />
          </InputGroup>

          <InputGroup>
            <Input.Label isRequired>Select Second Iteration</Input.Label>
            <Input.Select
              value={values.secondIteration}
              name={names.secondIteration}
              error={errors.secondIteration}
              options={secondIterationOptions}
              onChange={(selectedOption) =>
                setValues({ ...values, secondIteration: selectedOption })
              }
              isDisabled={isLoadingSubtractDsm}
              {...{ onBlur, onFocus }}
            />
          </InputGroup>
        </div>

        <FormMessage
          className="subtract-dsm__form-message--second"
          message="Second iteration is subtracted from the first iteration. (Iteration 1 - Iteration 2)"
          variant={FormMessageVariant.Info}
          showIcon
        />

        <InputGroup>
          <Input.Label isRequired>Elevation Threshold Value (m)</Input.Label>
          <Input.Number
            value={values.thresholdValue}
            name={names.thresholdValue}
            error={errors.thresholdValue}
            isInvalid={!!errors.thresholdValue}
            disabled={isLoadingSubtractDsm}
            onKeyDown={preventNonNumber}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>

        <div className="subtract-dsm__form__input-container">
          <InputGroup>
            <Input.Label
              isRequired
              info="Select the Iteration from which you want an Ortho to overlay on the new DSM."
            >
              Ortho from Iteration
            </Input.Label>
            <Input.Select
              value={values.iterationForOrtho}
              name={names.iterationForOrtho}
              error={errors.iterationForOrtho}
              options={iterationOptions}
              isLoading={isLoadingIterationList}
              onChange={(selectedOption) =>
                setValues({ ...values, iterationForOrtho: selectedOption })
              }
              isDisabled={isLoadingSubtractDsm}
              {...{ onBlur, onFocus }}
            />
          </InputGroup>
          <InputGroup>
            <Input.Label isRequired>Orthomosaic</Input.Label>
            <Input.Select
              value={values.orthoLayers}
              name={names.orthoLayers}
              error={errors.orthoLayers}
              options={layerListOptions}
              isLoading={isLoadingLayerList}
              onChange={(selectedOption) =>
                setValues({ ...values, orthoLayers: selectedOption })
              }
              isDisabled={isNil(layerListOptions) || isLoadingLayerList}
              {...{ onBlur, onFocus }}
            />
          </InputGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        {!isLoadingSubtractDsm && (
          <Button variant={ButtonVariant.Secondary} onClick={onCancelBtnClick}>
            Cancel
          </Button>
        )}
        <Button
          onClick={onSubmit}
          disabled={inputHasError()}
          isLoading={isLoadingSubtractDsm}
        >
          Subtract DSM
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
