import React, { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  SelectOption,
} from '@aus-platform/design-system';
import {
  OutputHorizontalCRSOptions,
  OutputVerticalCRSOptions,
} from '../constants';
import { EditTaskOptionsParamsType } from '../create-task-card';
import { TaskOptionsEditModalProps } from './types';
import { getTaskConfigFromPresetValue } from './preset-options-edit-helper';
import { useInputFields } from 'src/shared/hooks';
import { EPSGCode, VerticalCRS } from 'src/shared/enums';

export const TaskOptionsEditModal: React.FC<TaskOptionsEditModalProps> = ({
  taskOptions,
  onSave,
  onClose,
}) => {
  const defaultTaskOptions = {
    outputHorizontalCrs: EPSGCode.WGS84,
    outputVerticalCrs: VerticalCRS.ELLIPSOIDAL,
    horizontalAccuracy: 0.05,
    verticalAccuracy: 0.1,
    keyPointLimit: 40000,
    tiePointLimit: 1000,
    splitInBlocks: false,
    blockWidth: 4000,
    blockHeight: 4000,
    generateReportWithCheckpoints: false,
  };

  // States.
  const [horizontal, setHorizontal] = useState<SelectOption<EPSGCode>>(
    OutputHorizontalCRSOptions[0],
  );
  const [vertical, setVertical] = useState<SelectOption<VerticalCRS>>(
    OutputVerticalCRSOptions[0],
  );

  // Hooks.
  const { values, names, onChange, onBlur, onFocus, setValues } =
    useInputFields<EditTaskOptionsParamsType>({ ...defaultTaskOptions });

  useEffect(() => {
    // Set values from Custom task options.
    if (taskOptions && taskOptions.label === 'Custom') {
      const taskOptionsConfig = getTaskConfigFromPresetValue(
        taskOptions?.value,
      );
      setValues(() => taskOptionsConfig);

      const customHorizontalCrs = OutputHorizontalCRSOptions.find(
        (horizontal) =>
          horizontal.value == taskOptionsConfig.outputHorizontalCrs,
      );
      if (customHorizontalCrs) {
        setHorizontal(customHorizontalCrs);
      }
      const customVerticalCrs = OutputVerticalCRSOptions.find(
        (vertical) => vertical.value === taskOptionsConfig.outputVerticalCrs,
      );
      if (customVerticalCrs) {
        setVertical(customVerticalCrs);
      }
    }
    return () => {
      setValues(defaultTaskOptions);
    };
  }, [taskOptions]);

  // Handlers.
  const changeSplitInBlocks = () =>
    setValues((prevState) => ({
      ...prevState,
      splitInBlocks: !prevState.splitInBlocks,
    }));

  const changeGenerateReportWithCheckpoints = () =>
    setValues((prevState) => ({
      ...prevState,
      generateReportWithCheckpoints: !prevState.generateReportWithCheckpoints,
    }));

  const onSubmit = () => {
    onSave({
      ...values,
      outputHorizontalCrs: horizontal.value,
      outputVerticalCrs: vertical.value,
    });
  };

  return (
    <Modal
      show
      className="task-options-edit-modal fade-scale"
      dialogClassName="task-options-edit-modal-dialog"
      aria-labelledby="contained-modal-title-hcenter"
      centered
      keyboard
      scrollable
    >
      <Modal.Header
        className="header-txt-5 bold-txt justify-content-between"
        onHide={onClose}
        closeButton
      >
        Edit Task Options
      </Modal.Header>
      <Modal.Body>
        <div className="task-options-edit-modal__heading">
          OUTPUT COORDINATE SYSTEM
        </div>
        <div className="task-options-edit-modal__options-wrapper">
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Horizontal Datum</Input.Label>
              <Input.Select
                className="task-options-edit-modal__option-value"
                options={OutputHorizontalCRSOptions}
                value={horizontal}
                onChange={setHorizontal}
              />
            </InputGroup>
          </div>
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Vertical Datum</Input.Label>
              <Input.Select
                className="task-options-edit-modal__option-value"
                options={OutputVerticalCRSOptions}
                value={vertical}
                onChange={setVertical}
              />
            </InputGroup>
          </div>
        </div>

        <div className="task-options-edit-modal__heading">ALIGN PHOTOS</div>
        <div className="task-options-edit-modal__options-wrapper">
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Key Point Limit</Input.Label>
              <Input.Number
                value={values.keyPointLimit}
                name={names.keyPointLimit}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Tie Point Limit</Input.Label>
              <Input.Number
                value={values.tiePointLimit}
                name={names.tiePointLimit}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
        </div>

        <div className="task-options-edit-modal__heading">CAMERA ACCURACY</div>
        <div className="task-options-edit-modal__options-wrapper">
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Horizontal(m)</Input.Label>
              <Input.Number
                value={values.horizontalAccuracy}
                name={names.horizontalAccuracy}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Vertical(m)</Input.Label>
              <Input.Number
                value={values.verticalAccuracy}
                name={names.verticalAccuracy}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
        </div>

        <InputGroup className="task-options-edit-modal__heading">
          <Input.Label className="d-flex gap-2">
            <Input.CheckBox
              className="checkbox-no-background"
              checked={values.splitInBlocks}
              name={names.splitInBlocks}
              onChange={changeSplitInBlocks}
              {...{ onBlur, onFocus }}
            />
            <div>SPLIT IN BLOCKS</div>
          </Input.Label>
        </InputGroup>

        <div className="task-options-edit-modal__options-wrapper">
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Height(px)</Input.Label>
              <Input.Number
                value={!values.splitInBlocks ? '' : values.blockHeight}
                name={names.blockHeight}
                disabled={!values.splitInBlocks}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
          <div className="task-options-edit-modal__options">
            <InputGroup>
              <Input.Label>Width(px)</Input.Label>
              <Input.Number
                value={!values.splitInBlocks ? '' : values.blockWidth}
                name={names.blockWidth}
                disabled={!values.splitInBlocks}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
          </div>
        </div>
        <div className="task-options-edit-modal">
          <Input.Label className="d-flex gap-2">
            <Input.CheckBox
              className="checkbox-no-background"
              name={names.generateReportWithCheckpoints}
              checked={values.generateReportWithCheckpoints}
              onChange={changeGenerateReportWithCheckpoints}
            />
            <div>Generate Report with only Checkpoints</div>
          </Input.Label>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          className="me-4"
          variant={ButtonVariant.Secondary}
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button className="aus-save-btn" onClick={onSubmit}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
