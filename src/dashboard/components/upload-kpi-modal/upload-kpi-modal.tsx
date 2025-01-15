import {
  Button,
  ButtonVariant,
  IconIdentifier,
  Input,
  InputGroup,
} from '@aus-platform/design-system';
import FileSaver from 'file-saver';
import { isNull, startCase } from 'lodash';
import React, { useEffect } from 'react';
import { Modal, ModalProps } from 'react-bootstrap';
import { UseMutationResult } from '@tanstack/react-query';
import { useAppDispatch, useAppSelector } from '../../../app/hooks';
import {
  ApiErrorResponse,
  ApiResponse,
  UploadKpiPayload,
  handleResponseMessage,
  useDownloadKpiTemplate,
} from '../../../shared/api';
import { useInputFields } from '../../../shared/hooks';
import { refetchKPIs, selectDashboardDataset } from '../../dashboard-slices';
import { DashboardKpi } from '../../enums';
import { UploadModalInputType } from './types';
import { uploadKpiInputValidator } from './validator';

type UploadKpiModalProps = ModalProps & {
  onClose: () => void;
  uploadKpiRequest: UseMutationResult<
    ApiResponse,
    ApiErrorResponse,
    UploadKpiPayload,
    unknown
  >;
  kpiType: DashboardKpi;
  templateName: string;
};

const uploadKpiModalInitialInputState: UploadModalInputType = {
  csvFile: null,
};

export const UploadKpiModal: React.FC<UploadKpiModalProps> = ({
  onClose,
  show,
  uploadKpiRequest,
  kpiType,
  templateName,
  ...rest
}) => {
  // Selectors.
  const dataset = useAppSelector(selectDashboardDataset);

  // State.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    resetAll,
  } = useInputFields<UploadModalInputType>(
    uploadKpiModalInitialInputState,
    uploadKpiInputValidator,
  );

  // Hooks.
  const dispatch = useAppDispatch();

  // APIs.
  const {
    mutate: uploadFile,
    data: uploadFileResponse,
    isError: isErrorUploadFile,
    isPending: isLoadingUploadFile,
    isSuccess: isSuccessUploadFile,
    error: uploadFileError,
  } = uploadKpiRequest;

  const {
    mutate: sendDownloadTemplateRequest,
    data: downloadTemplateResponse,
    isSuccess: isSuccessDownloadTemplateRequest,
    isPending: isLoadingDownloadTemplateRequest,
  } = useDownloadKpiTemplate();

  // useEffects.
  useEffect(() => {
    if (isSuccessUploadFile && uploadFileResponse) {
      onCancelBtnClick();
      dispatch(refetchKPIs());
    }
    handleResponseMessage(
      isSuccessUploadFile,
      isErrorUploadFile,
      uploadFileResponse,
      uploadFileError,
    );
  }, [isSuccessUploadFile, isErrorUploadFile]);

  useEffect(() => {
    if (downloadTemplateResponse && isSuccessDownloadTemplateRequest) {
      FileSaver.saveAs(downloadTemplateResponse, templateName);
    }
  }, [downloadTemplateResponse, isSuccessDownloadTemplateRequest]);

  // Handlers.
  const onDownloadTemplateBtnClick = () => {
    sendDownloadTemplateRequest(kpiType);
  };

  const onCsvFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Calling useInputFields's onChange for validation.
    onChange(event);

    const files = event.target.files;
    if (!isNull(files)) {
      setValues({ ...values, csvFile: files[0] });
    }
  };

  const onCancelBtnClick = () => {
    onClose();
    resetAll();
    setValues(uploadKpiModalInitialInputState);
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!inputHasError() && dataset.site && values.csvFile) {
      uploadFile({
        siteId: dataset.site.value.id,
        csvFile: values.csvFile,
      });
    }
  };

  return (
    <Modal
      {...rest}
      show={show}
      onHide={onCancelBtnClick}
      size="sm"
      backdrop="static"
      dialogClassName="upload-modal"
      centered
    >
      <Modal.Header closeButton>Upload {startCase(kpiType)} KPIs</Modal.Header>
      <Modal.Body className="upload-modal__form">
        {/* Upload CSV file field */}
        <InputGroup>
          <Input.Label isRequired>Select KPI File</Input.Label>
          <Input.File
            placeholder="Select a .CSV file"
            accept=".csv"
            multiple={false}
            name={names.csvFile}
            error={errors.csvFile}
            isInvalid={!!errors.csvFile}
            disabled={isLoadingUploadFile}
            onChange={onCsvFileChange}
            {...{ onBlur, onFocus }}
          />
        </InputGroup>

        {/* Download template button */}
        <Button
          className="upload-modal__download-template-btn"
          rightIconIdentifier={IconIdentifier.Download}
          variant={ButtonVariant.Link}
          onClick={onDownloadTemplateBtnClick}
          isLoading={isLoadingDownloadTemplateRequest}
        >
          Download CSV Template
        </Button>
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant={ButtonVariant.Secondary}
          onClick={onCancelBtnClick}
          disabled={isLoadingUploadFile}
        >
          Cancel
        </Button>
        <Button
          disabled={inputHasError()}
          onClick={onSubmit}
          isLoading={isLoadingUploadFile}
        >
          Upload
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
