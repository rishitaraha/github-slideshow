import {
  Button,
  ButtonVariant,
  CheckBox,
  ColorClass,
  FormMessage,
  FormMessageVariant,
  Icon,
  IconIdentifier,
  Input,
  InputGroup,
  ProgressBar,
  SideCard,
  SideCardLocation,
  TabSwitcher,
  Tooltip,
  getProgressStatus,
} from '@aus-platform/design-system';
import classnames from 'classnames';
import { isEmpty, isNil } from 'lodash';
import React, { FormEvent, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { GroupBase, OptionProps } from 'react-select';
import { layerTabs } from '../../constants';
import {
  initialLayerInputState,
  layerTypeLabels,
  layerTypeOptions,
} from '../constants';
import { LayerSubmitButtonText } from '../enums';
import { AccessTagType, LayerInput } from '../types';
import { layerInputValidator, layerValidatorInitialState } from '../validator';
import { AccessTags } from './components/access-tags';
import {
  AddLayerPayload,
  FileDataType,
  LayerType,
  handleResponseMessage,
  useAccessTagList,
  useAddFile,
  useAddLayer,
  useDeleteFile,
  useFileDownload,
} from 'shared/api';
import { FileCard } from 'shared/components';
import { ConfirmationCard } from 'shared/components/cards';
import { GlobalContext } from 'shared/context';
import { FileExtension } from 'shared/enums';
import { isOrgAdmin } from 'shared/helpers';
import { fileValidate } from 'shared/helpers/file-validator';
import {
  FileType,
  MultiPartUploadUrls,
  getFileUploadStatus,
  useInputFields,
  useMultipartUpload,
} from 'shared/hooks';
import { LayersOptionType } from 'src/layers/types';

type AddLayerProps = {
  showSideCard: boolean;
  closeAddLayer: () => void;
  refetchLayerList: () => void;
  isAccessTagsTabHidden: boolean;
};

export const AddLayers: React.FC<AddLayerProps> = ({
  showSideCard,
  closeAddLayer,
  refetchLayerList,
  isAccessTagsTabHidden,
}) => {
  // Context.
  const { loggedUser } = useContext(GlobalContext);

  // States
  const [activeTab, setActiveTab] = useState(layerTabs.Basic);
  const [accessTags, setAccessTags] = useState<AccessTagType[]>([]);
  const [submitBtnText, setSubmitBtnText] = useState(
    LayerSubmitButtonText.ADD_LAYER,
  );
  const [selectedLayerType, setSelectedLayerType] = useState<LayerType | null>(
    null,
  );
  const [fileId, setFileId] = useState('');
  const [fileData, setFileData] = useState<FileDataType>();
  const [showDeleteConfirmationCard, setShowConfirmationCard] = useState(false);
  const [showCancelConfirmationCard, setShowCancelConfirmationCard] =
    useState(false);
  const [fileType, setFileType] = useState<FileType>(
    loggedUser?.featureFlags.mbtiles ? FileType.MBTiles : FileType.Orthomosaic,
  );

  // Hooks.
  const { search } = useLocation();
  const iterationId = new URLSearchParams(search).get('iterationId');
  const {
    values,
    names,
    errors,
    setErrors,
    setValues,
    optional,
    setOptional,
    inputHasError,
    resetAll: resetAllInputs,
    onBlur,
    onChange,
    onFocus,
    setValidatorParams,
    validatorParams,
    getOptionalFields,
  } = useInputFields<LayerInput>(
    initialLayerInputState,
    layerInputValidator,
    true,
    false,
    layerValidatorInitialState,
  );

  const {
    mutate: sendDownloadUrlRequest,
    data: downloadFileResponse,
    isSuccess: isSuccessFileDownloadResponse,
  } = useFileDownload();

  const {
    progress,
    setUrls: setMultipartUploadUrls,
    startUploading,
    reset: resetMultipartUpload,
    cancelUpload,
    fileResponse: multipartUploadFileResponse,
  } = useMultipartUpload({
    fileType,
  });

  // Constants.
  const multipartFileUploadStatus = getFileUploadStatus(progress);
  const isFileUploadOngoing =
    multipartFileUploadStatus.isFileProcessing ||
    multipartFileUploadStatus.isFileUploading;

  // Apis.
  const { data: accessTagListResponse, isSuccess: accessTagIsSuccess } =
    useAccessTagList();

  const {
    mutate: sendAddLayerRequest,
    data: addLayerData,
    isSuccess: isSuccessAddLayer,
    isPending: isLoadingAddLayer,
    isError: isErrorAddLayer,
    error: addLayerError,
  } = useAddLayer();

  const { mutate: sendDeleteFileRequest, isSuccess: isDeleteFileSuccess } =
    useDeleteFile();

  const {
    mutate: sendAddFileInfoRequst,
    data: addFileInfoResponse,
    isPending: isLoadingAddFile,
    isSuccess: isSuccessAddFile,
  } = useAddFile();

  // useEffects.
  useEffect(() => {
    if (isSuccessAddLayer && addLayerData) {
      refetchLayerList();
      setValues(initialLayerInputState);
      closeAddLayer();
      resetAllInputs();
      setActiveTab(layerTabs.Basic);
      resetFile();
      resetLayerType();
    }

    handleResponseMessage(
      isSuccessAddLayer,
      isErrorAddLayer,
      addLayerData,
      addLayerError,
    );
  }, [addLayerData, isSuccessAddLayer, isErrorAddLayer]);

  useEffect(() => {
    if (accessTagListResponse && accessTagIsSuccess) {
      setAccessTags(
        accessTagListResponse.data.list.map(({ id, name }) => ({ id, name })),
      );
    }
  }, [accessTagListResponse, accessTagIsSuccess]);

  useEffect(() => {
    if (selectedLayerType) {
      handleOptionalFields();
    }
  }, [showSideCard, selectedLayerType]);

  useEffect(() => {
    if (
      multipartFileUploadStatus.isFileUploaded ||
      multipartFileUploadStatus.isFileUploadError
    ) {
      setSubmitBtnText(LayerSubmitButtonText.NEXT);
    } else if (multipartFileUploadStatus.isFileUploading) {
      setSubmitBtnText(LayerSubmitButtonText.UPLOADING);
    } else if (multipartFileUploadStatus.isFileProcessing) {
      setSubmitBtnText(LayerSubmitButtonText.PROCESSING);
    } else if (multipartFileUploadStatus.isFileIdle) {
      setSubmitBtnText(LayerSubmitButtonText.NEXT);
    }
  }, [progress]);

  useEffect(() => {
    if (isSuccessAddFile && addFileInfoResponse && values.layerFile) {
      const fileId = addFileInfoResponse.data.id;

      const multiPartUploadUrls: MultiPartUploadUrls = {
        startUploadUrl: `/files/${fileId}/upload-file/`,
        presignedUrl: `/files/${fileId}/presigned-url/`,
        completeUploadUrl: `/files/${fileId}/complete-upload/`,
      };

      setMultipartUploadUrls(multiPartUploadUrls);
      setFileId(fileId);
    }
  }, [isSuccessAddFile, addFileInfoResponse]);

  useEffect(() => {
    if (fileId && values.layerFile) {
      startUploading(values.layerFile);
    }
  }, [fileId]);

  useEffect(() => {
    if (isDeleteFileSuccess) {
      setValues({ ...values, layerFile: null });
      resetFile();
    }
  }, [isDeleteFileSuccess]);

  // Setup validation for when user is not allowed to upload mbtiles.
  useEffect(() => {
    if (loggedUser?.featureFlags.mbtiles) {
      setValidatorParams({
        ...layerValidatorInitialState,
        layerFile: {
          hasPermissionToUploadMbTiles: loggedUser?.featureFlags.mbtiles,
        },
      });
    }
  }, [loggedUser]);

  useEffect(() => {
    if (selectedLayerType) {
      setValues({
        ...values,
        type: {
          label: layerTypeLabels[selectedLayerType],
          value: selectedLayerType,
        },
      });
    }

    setValidatorParams((prevValidatorParams) => {
      return { ...prevValidatorParams, type: selectedLayerType };
    });

    handleOptionalFields();
  }, [selectedLayerType]);

  useEffect(() => {
    if (isSuccessFileDownloadResponse && downloadFileResponse?.downloadUrl) {
      window.location.href = downloadFileResponse.downloadUrl;
    }
  }, [isSuccessFileDownloadResponse, downloadFileResponse]);

  useEffect(() => {
    if (multipartUploadFileResponse) {
      setFileData(multipartUploadFileResponse);
    }
  }, [multipartUploadFileResponse]);

  // Constants.
  const isAddLayerRequestAllowed =
    !isNil(iterationId) &&
    (activeTab === layerTabs.AccessTags || isAccessTagsTabHidden) &&
    (isOrgAdmin(loggedUser) ||
      !isEmpty(values.accessTags) ||
      isAccessTagsTabHidden);

  // Handlers.
  const isAddLayerButtonShowing = () => {
    if (activeTab === layerTabs.AccessTags) {
      return true;
    } else if (isAccessTagsTabHidden) {
      if (
        multipartFileUploadStatus.isFileUploading ||
        multipartFileUploadStatus.isFileProcessing
      ) {
        return false;
      }
      if (isNil(values.layerFile) || multipartFileUploadStatus.isFileUploaded) {
        return true;
      }
    } else {
      return false;
    }
  };

  const isAddLayerButtonDisabled = () => {
    if (!isOrgAdmin(loggedUser)) {
      if (isAccessTagsTabHidden) {
        return inputHasError(getOptionalFields());
      } else if (isEmpty(values.accessTags)) {
        return true;
      }
    }
    return false;
  };

  const onTabSwitch = (tabKey: string) => {
    if (tabKey == layerTabs.AccessTags && !inputHasError(getOptionalFields())) {
      setActiveTab(tabKey);
    } else {
      setActiveTab(layerTabs.Basic);
    }
  };

  const onNextButtonClick = () => {
    if (!inputHasError(getOptionalFields())) {
      setActiveTab(layerTabs.AccessTags);
      setSubmitBtnText(LayerSubmitButtonText.ADD_LAYER);
    }
  };

  const onFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!isNil(files)) {
      setValues((prevValue) => {
        const updatedValues = { ...prevValue, layerFile: files[0] };
        validateLayerFile(updatedValues);
        return updatedValues;
      });

      if (
        fileValidate.extension(files[0], FileExtension.MBTiles) ||
        fileValidate.extension(files[0], FileExtension.GeoTIFF)
      ) {
        setSubmitBtnText(LayerSubmitButtonText.UPLOAD);
      } else if (fileValidate.extension(files[0], FileExtension.ZIP)) {
        setSubmitBtnText(LayerSubmitButtonText.NEXT);
      }
    }
  };

  const onCloseSideCard = () => {
    resetAllInputs();
    resetFile();
    resetLayerType();
    setActiveTab(layerTabs.Basic);
    closeAddLayer();
  };

  const handleOptionalFields = () => {
    /*     
      if the user switches the layer type to something other than mapbox then sourceId becomes optional
      otherwise layerFile becomes optional.
     */
    if (selectedLayerType === LayerType.MapBox) {
      setOptional({
        ...optional,
        sourceId: false,
        layerFile: true,
        accessTags: true,
      });
    } else {
      setOptional({
        ...optional,
        sourceId: true,
        layerFile: false,
        accessTags: true,
      });
    }
  };

  const isSelectedLayerTypeWithFile = () => {
    return (
      selectedLayerType === LayerType.MBTiles ||
      selectedLayerType === LayerType.Orthomosaic ||
      selectedLayerType === LayerType.CapturedDsm
    );
  };

  // Add layers form handlers.
  const showDeleteConfirmation = () => setShowConfirmationCard(true);

  const closeDeleteConfirmation = () => setShowConfirmationCard(false);

  const deleteLayerFile = () => {
    sendDeleteFileRequest({ id: fileId, iterationId: iterationId });
    setShowConfirmationCard(false);
  };

  // Cancel add layers form handlers
  const showCancelConfirmation = () => {
    if (isFileUploadOngoing) {
      setShowCancelConfirmationCard(true);
    } else {
      onCloseSideCard();
    }
  };

  const closeCancelConfirmation = () => setShowCancelConfirmationCard(false);

  // Validate the corresponding layer file when layer file is changed.
  const validateLayerFile = (updatedValues) => {
    setErrors({
      ...errors,
      layerFile: layerInputValidator(
        'layerFile',
        updatedValues,
        undefined,
        validatorParams,
      ),
    });
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    /*
      Enable submit when:-
        i) current user is org admin and:-
          - current tab is access tags.

        ii) current user is member and:-
          - current tab is access tags and access tags are not empty.
          - access tabs are disabled.

        TODO: please optimise this this condition later.
    */
    if (isAddLayerRequestAllowed && selectedLayerType) {
      const sourceId: string | null = values.sourceId ? values.sourceId : null;

      const payload: AddLayerPayload = {
        name: values.name,
        iteration: iterationId,
        sourceId: sourceId,
        type: selectedLayerType,
        accessTags: values.accessTags,
      };

      if (!isNil(fileData)) {
        payload.fileId = fileData.id;
      }

      if (selectedLayerType === LayerType.Vector) {
        if (!isNil(values.layerFile)) {
          payload.featuresFile = values.layerFile;
        }

        if (!isNil(values.clampToTerrain)) {
          payload.clampToTerrain = values.clampToTerrain;
        }
      }
      sendAddLayerRequest(payload);
    }
  };

  const onClickUploadOrNextButtonHandler = () => {
    if (
      submitBtnText === LayerSubmitButtonText.UPLOAD &&
      isSelectedLayerTypeWithFile() &&
      values.layerFile &&
      selectedLayerType
    ) {
      sendAddFileInfoRequst({
        filename: values.layerFile.name,
        filetype: selectedLayerType,
      });
    } else if (
      submitBtnText === LayerSubmitButtonText.NEXT &&
      multipartFileUploadStatus.isFileUploaded
    ) {
      onNextButtonClick();
      // setProgress(ProgressBarState.Initial);
    } else {
      setActiveTab(layerTabs.AccessTags);
    }
  };

  const onClickCancel = () => {
    cancelUpload();
    setValues({
      ...values,
      name: '',
      layerFile: null,
    });

    closeCancelConfirmation();
    onCloseSideCard();
  };

  const onSelectLayerType = (selectedOption: LayersOptionType) => {
    if (!selectedOption) {
      return;
    }
    const updatedValues = { ...values, type: selectedOption };
    const updatedSelectedLayerType = selectedOption.value;

    setSelectedLayerType(updatedSelectedLayerType);

    // Setting file type for multipart upload.
    if (updatedSelectedLayerType === LayerType.MBTiles) {
      setFileType(FileType.MBTiles);
    } else if (updatedSelectedLayerType === LayerType.Orthomosaic) {
      setFileType(FileType.Orthomosaic);
    }
    setValues(updatedValues);

    // Validate layer file when file is already selected and type is changed.
    if (!isNil(values.layerFile)) {
      validateLayerFile(updatedValues);
    }
  };

  // Radio handlers.
  const resetLayerType = () => {
    let layerType;
    if (loggedUser?.featureFlags.mbtiles) {
      layerType = LayerType.MBTiles;
    } else {
      layerType = LayerType.MapBox;
    }
    setSelectedLayerType(layerType);
  };

  const resetFile = () => {
    setFileId('');
    setFileData(undefined);
    resetMultipartUpload();
  };

  // Renderers.
  const renderSelectOption = ({ innerProps, isDisabled, value, label }) => {
    const customClassName = classnames([
      'layer-sidecard-form__option',
      isDisabled && 'disabled',
    ]);

    switch (value) {
      case LayerType.MBTiles:
        if (loggedUser?.featureFlags.mbtiles) {
          return (
            <div className={customClassName} {...innerProps}>
              {label}
            </div>
          );
        } else {
          return null;
        }
      default:
        return (
          <div className={customClassName} {...innerProps}>
            {label}
          </div>
        );
    }
  };

  const renderLayerFileUpload = () => {
    if (isSelectedLayerTypeWithFile() && fileData && fileId) {
      return (
        <InputGroup>
          <FileCard
            fileName={fileData.filename}
            fileSize={fileData.size}
            onDownloadClick={() => sendDownloadUrlRequest(fileData.id)}
            onDeleteBtnClick={showDeleteConfirmation}
            fileCardDataTestId="add-layer-file-card"
            deleteBtnDataTestId="remove-layer-file-button"
          />
          {showDeleteConfirmationCard && (
            <ConfirmationCard
              title="Delete Confirmation"
              message={`Are you sure you want to delete ${fileData.filename} file?`}
              onSubmit={deleteLayerFile}
              onCancel={closeDeleteConfirmation}
              submitLabel="Delete"
              cancelLabel="Cancel"
              onCancelBtnDataTestId="cancel-delete-layer-file-button"
              onSubmitButtonDataTestId="confirm-delete-layer-file-button"
            />
          )}
        </InputGroup>
      );
    }
    if (
      !multipartFileUploadStatus.isFileIdle &&
      isSelectedLayerTypeWithFile()
    ) {
      return (
        <InputGroup>
          <small className="neutral-300-txt mb-1">
            Status : {getProgressStatus(progress)}
          </small>
          <ProgressBar now={progress} />
        </InputGroup>
      );
    }
    return (
      <InputGroup>
        <Input.Label isRequired>Select File</Input.Label>
        <Input.File
          accept=".zip,.mbtiles,.tif,.tiff"
          multiple={false}
          onChange={onFileSelect}
          name={names.layerFile}
          error={errors.layerFile}
          onBlur={validateLayerFile}
          isInvalid={!!errors.layerFile}
          {...{ onFocus }}
        />
      </InputGroup>
    );
  };

  const renderAddLayersForm = () => {
    return (
      <form className="layer-sidecard-form" onSubmit={onSubmit}>
        {/* Layer Name */}
        <InputGroup className="layer-sidecard-form__layer-name__text-sm">
          <Input.Label isRequired> Layer Name </Input.Label>
          <Input.Text
            placeholder="Layer Name"
            value={values.name}
            name={names.name}
            error={errors.name}
            isInvalid={!!errors.name}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        {/* Layer Type */}
        <InputGroup className="layer-sidecard-form__layer-type">
          <Input.Label isRequired> Layer Type </Input.Label>
          <Input.Select
            options={layerTypeOptions}
            onChange={onSelectLayerType}
            value={values.type}
            placeholder="Select layer type"
            components={{
              Option: renderSelectOption as unknown as React.ComponentType<
                OptionProps<any, boolean, GroupBase<any>>
              >,
            }}
          />
        </InputGroup>
        {/* Clamp to Terrain */}
        {selectedLayerType == LayerType.Vector && (
          <>
            <FormMessage
              variant={FormMessageVariant.Default}
              message="Please ensure you upload a zipped shapefile containing only a specific feature type (line/polygon/point)"
            />
            <InputGroup className="add-layers__checkbox-input-group">
              <CheckBox
                title="Clamp to Terrain"
                checked={values.clampToTerrain}
                onClick={() =>
                  setValues((prev) => ({
                    ...prev,
                    clampToTerrain: !prev.clampToTerrain,
                  }))
                }
              />

              <Tooltip hoverText="Assign z-elevation value to the layer based on the current iteration’s DSM">
                <Icon
                  identifier={IconIdentifier.InfoCircle}
                  size={16}
                  colorClass={ColorClass.Primary500}
                />
              </Tooltip>
            </InputGroup>
          </>
        )}
        {selectedLayerType !== LayerType.MapBox ? (
          renderLayerFileUpload()
        ) : (
          <InputGroup className="layer-sidecard-form__layer-id__text-sm">
            <Input.Label isRequired> Source ID </Input.Label>
            <Input.Text
              placeholder="Source ID"
              value={values.sourceId}
              name={names.sourceId}
              error={errors.sourceId}
              isInvalid={!!errors.sourceId}
              disabled={values.type?.value !== LayerType.MapBox}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        )}
      </form>
    );
  };

  return (
    <div className="add-layers">
      {/*
              Only show close button when we are in the basic tab.
              Since we have to restrict user from closing the sidecard once
              the file is uploaded and tab is switched to access tags.
       */}
      <SideCard
        title="Add Layers"
        showCloseButton={activeTab === layerTabs.Basic}
        placement={SideCardLocation.End}
        show={showSideCard}
        data-testid="add-layer-sidecard"
        onClose={() =>
          isFileUploadOngoing ? showCancelConfirmation() : onCloseSideCard()
        }
        className={'layer-sidecard'}
        footerClassName="justify-content-end"
        footer={
          <>
            {activeTab === layerTabs.Basic && (
              <Button
                variant={ButtonVariant.Secondary}
                onClick={showCancelConfirmation}
                data-testid="add-layer-cancel-btn-footer"
              >
                Cancel
              </Button>
            )}

            {isAddLayerButtonShowing() ? (
              <Button
                onClick={onSubmit}
                disabled={isAddLayerButtonDisabled()}
                isLoading={isLoadingAddLayer}
                data-testid="add-layer-submit-btn"
              >
                Add Layer
              </Button>
            ) : (
              <Button
                onClick={onClickUploadOrNextButtonHandler}
                disabled={
                  inputHasError(getOptionalFields()) ||
                  multipartFileUploadStatus.isFileUploadError
                }
                data-testid="add-layer-submit-btn"
                isLoading={
                  isLoadingAddFile ||
                  multipartFileUploadStatus.isFileUploading ||
                  multipartFileUploadStatus.isFileProcessing
                }
              >
                {submitBtnText}
              </Button>
            )}
          </>
        }
      >
        <>
          {isAccessTagsTabHidden ? (
            renderAddLayersForm()
          ) : (
            <TabSwitcher
              tabComponentList={[
                {
                  label: layerTabs.Basic,
                  children: renderAddLayersForm(),
                  key: layerTabs.Basic,
                  disabled: isLoadingAddLayer,
                },
                {
                  label: layerTabs.AccessTags,
                  children: (
                    <AccessTags
                      accessTags={accessTags}
                      setAccessTags={setAccessTags}
                      loggedUser={loggedUser}
                      values={values}
                      setValues={setValues}
                      accessTagListResponse={accessTagListResponse?.data}
                    />
                  ),
                  disabled:
                    submitBtnText !== LayerSubmitButtonText.NEXT ||
                    !multipartFileUploadStatus.isFileUploaded,
                  key: layerTabs.AccessTags,
                },
              ]}
              activeKey={activeTab}
              onTabSwitch={onTabSwitch}
            />
          )}
        </>

        <InputGroup className="layer-sidecard-form">
          {showCancelConfirmationCard && (
            <ConfirmationCard
              title="Cancel Confirmation"
              message="Are you sure you want to cancel adding layers?"
              onSubmit={onClickCancel}
              onCancel={closeCancelConfirmation}
              submitLabel="Cancel"
              cancelLabel="Go Back"
            />
          )}
        </InputGroup>
      </SideCard>
    </div>
  );
};
