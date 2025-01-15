import {
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  ProgressBar,
  ProgressBarVariant,
  RadioToggle,
  SideCard,
  SideCardLocation,
  Spinner,
  StatusIndicatorLevel,
  TabSwitcher,
  getProgressStatus,
} from '@aus-platform/design-system';
import { isEmpty, isNil } from 'lodash';
import React, {
  FormEvent,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useLocation } from 'react-router-dom';
import { initialLayerInputState } from '..';
import { layerTabs, layerTypesLabel } from '../../constants';
import { LayerSubmitButtonText } from '../enums';
import { AccessTagType, LayerInput } from '../types';
import { layerInputValidator, layerValidatorInitialState } from '../validator';
import { AccessTags } from './components/access-tags';
import {
  FileDataType,
  LayerType,
  UpdateLayer,
  handleResponseMessage,
  useAccessTagList,
  useAddFile,
  useDeleteFile,
  useFileDownload,
  useLayer,
  useUpdateLayer,
} from 'shared/api';
import { FileCard } from 'shared/components';
import { ConfirmationCard } from 'shared/components/cards';
import { FileFormatByExtension } from 'shared/constants';
import { GlobalContext } from 'shared/context';
import { FileFormat } from 'shared/enums';
import {
  FileType,
  getFileUploadStatus,
  MultiPartUploadUrls,
  useInputFields,
  useMultipartUpload,
} from 'shared/hooks';

type EditLayerProps = {
  showSideCard: boolean;
  closeEditLayer: () => void;
  refetchLayerList: () => void;
  layerId: string;
  isAccessTagsTabHidden: boolean;
};

export const EditLayers: React.FC<EditLayerProps> = ({
  showSideCard,
  closeEditLayer,
  refetchLayerList,
  layerId,
  isAccessTagsTabHidden,
}) => {
  // States.
  const [activeTabKey, setActiveTabKey] = useState(layerTabs.Basic);
  const [accessTags, setAccessTags] = useState<AccessTagType[]>([]);
  const [submitBtnText, setSubmitBtnText] = useState(
    LayerSubmitButtonText.UPDATE_LAYER,
  );
  const [showDeleteConfirmationCard, setShowDeleteConfirmationCard] =
    useState(false);
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileData, setFileData] = useState<FileDataType | null>(null);
  const [fileType, setFileType] = useState<FileType>(FileType.MBTiles);

  // Hooks.
  const {
    values,
    names,
    errors,
    dirty,
    setDirty,
    setValues,
    optional,
    setOptional,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
    setValidatorParams,
  } = useInputFields<LayerInput>(
    initialLayerInputState,
    // To avoid calling validator twice when add layer side card is open.
    showSideCard ? layerInputValidator : () => '',
  );

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

  const {
    mutate: sendDownloadUrlRequest,
    data: downloadFileResponse,
    isSuccess: isSuccessFileDownloadResponse,
  } = useFileDownload();

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);

  // Memo's.
  const showSourceId = useMemo(() => {
    /*
      Hide sourceId when layer type is something other than
      Cesium/Mapbox.
    */
    const layerTypes = [LayerType.Cesium, LayerType.MapBox];
    return !isNil(values.type) && layerTypes.includes(values.type.value);
  }, [values.type]);

  // Constants.
  const { search } = useLocation();
  const iterationId = new URLSearchParams(search).get('iterationId');
  const layersWithUploadedFile = [
    LayerType.MBTiles,
    LayerType.Orthomosaic,
    LayerType.CapturedDsm,
  ];

  const sourceIdIsOptional =
    (!showSourceId && !inputHasError([names.accessTags, names.sourceId])) ||
    (showSourceId && !inputHasError([names.accessTags]));

  const multipartFileUploadStatus = getFileUploadStatus(progress);
  const isFileUploadOngoing =
    multipartFileUploadStatus.isFileProcessing ||
    multipartFileUploadStatus.isFileUploading;

  // Apis.
  const {
    mutate: sendUpdateLayerRequest,
    data: updateLayerData,
    isPending: isLoadingUpdateLayer,
    isSuccess: isSuccessUpdateLayer,
    isError: isErrorUpdateLayer,
    error: updateLayerError,
  } = useUpdateLayer();

  const {
    data: layerResponse,
    isSuccess: isSuccessLayer,
    isLoading: isLoadingLayer,
    refetch: refetchCurrentLayer,
  } = useLayer(layerId, !isEmpty(layerId));

  const { data: accessTagListResponse, isSuccess: accessTagIsSuccess } =
    useAccessTagList();

  const { mutate: sendDeleteFileRequest, isSuccess: isSuccessDeleteFile } =
    useDeleteFile();

  const {
    mutate: sendAddFileInfoRequst,
    data: addFileInfoResponse,
    isPending: isLoadingAddFile,
    isSuccess: isSuccessAddFile,
  } = useAddFile();

  // useEffects.
  useEffect(() => {
    if (isSuccessFileDownloadResponse && downloadFileResponse?.downloadUrl) {
      window.location.href = downloadFileResponse.downloadUrl;
    }
  }, [isSuccessFileDownloadResponse, downloadFileResponse]);

  useEffect(() => {
    if (isSuccessAddFile && addFileInfoResponse && values.layerFile) {
      const fileId = addFileInfoResponse.data.id;
      setFileId(fileId);

      const multiPartUploadUrls: MultiPartUploadUrls = {
        startUploadUrl: `/files/${fileId}/upload-file/`,
        presignedUrl: `/files/${fileId}/presigned-url/`,
        completeUploadUrl: `/files/${fileId}/complete-upload/`,
      };

      setMultipartUploadUrls(multiPartUploadUrls);
    }
  }, [isSuccessAddFile, addFileInfoResponse]);

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
    if (layerId && showSideCard) {
      refetchCurrentLayer();
    }
  }, [showSideCard]);

  useEffect(() => {
    if (isSuccessDeleteFile) {
      resetFile();
    }
  }, [isSuccessDeleteFile]);

  useEffect(() => {
    if (isSuccessUpdateLayer && updateLayerData) {
      refetchLayerList();
      resetAll();
      closeEditLayer();
      setActiveTabKey(layerTabs.Basic);
      setValues(initialLayerInputState);
      resetFile();
    }
    handleResponseMessage(
      isSuccessUpdateLayer,
      isErrorUpdateLayer,
      updateLayerData,
      updateLayerError,
    );
  }, [updateLayerData, isSuccessUpdateLayer, isErrorUpdateLayer]);

  useEffect(() => {
    if (layerResponse && isSuccessLayer) {
      const sourceId = layerResponse.sourceId ? layerResponse.sourceId : '';
      const layerData: LayerInput = {
        name: layerResponse.name,
        type: {
          label: layerTypesLabel[layerResponse.type],
          value: layerResponse.type,
        },
        sourceId: sourceId,
        accessTags: layerResponse.accessTags,
      };

      // Accessing Layer File to show on file card.
      const layerFiles = layerResponse.files;
      let layerFile;

      switch (layerResponse.type) {
        case LayerType.Orthomosaic:
          if (layerFiles) {
            layerFile = layerFiles.filter((file) => {
              return (
                file.type === FileType.Orthomosaic &&
                FileFormatByExtension[file.extension] === FileFormat.GeoTIFF
              );
            });

            setFileType(FileType.Orthomosaic);
          }
          break;
        case LayerType.MBTiles:
          if (layerFiles) {
            layerFile = layerFiles.filter((file) => {
              return (
                file.type === FileType.MBTiles &&
                FileFormatByExtension[file.extension] === FileFormat.MBTiles
              );
            });

            setFileType(FileType.MBTiles);
          }
          break;
        case LayerType.SlopeMap:
          if (layerFiles) {
            layerFile = layerFiles.filter((file) => {
              return (
                file.type === FileType.SlopeMap &&
                FileFormatByExtension[file.extension] === FileFormat.GeoTIFF
              );
            });

            setFileType(FileType.SlopeMap);
          }
          break;
      }

      if (layerFile && layerFile.length > 0) {
        layerData['layerFile'] = new File([], layerFile[0].filename);
        setFileData(layerFile[0]);
      }

      setValues({
        ...layerData,
      });

      // Setting fields optional according to selected layer type.
      switch (layerResponse.type) {
        case LayerType.MBTiles:
        case LayerType.Orthomosaic:
        case LayerType.CapturedDsm:
          setOptional({ ...optional, sourceId: true, layerFile: false });
          break;
        case LayerType.MapBox:
        case LayerType.Cesium:
          setOptional({ ...optional, sourceId: false, layerFile: true });
          break;
        default:
          setOptional({ ...optional, sourceId: true, layerFile: true });
      }
    }

    // Setting Validator params.
    setValidatorParams((prevValidatorParams) => {
      return { ...prevValidatorParams, type: layerResponse?.type };
    });
  }, [layerResponse, isSuccessLayer]);

  useEffect(() => {
    if (accessTagListResponse && accessTagIsSuccess) {
      setAccessTags(
        accessTagListResponse.data.list.map(({ id, name }) => ({ id, name })),
      );
    }
  }, [accessTagListResponse, accessTagIsSuccess]);

  useEffect(() => {
    if (
      multipartFileUploadStatus.isFileUploaded ||
      multipartFileUploadStatus.isFileUploadError
    ) {
      setSubmitBtnText(LayerSubmitButtonText.DONE);
    } else if (multipartFileUploadStatus.isFileUploading) {
      setSubmitBtnText(LayerSubmitButtonText.UPLOADING);
    } else if (multipartFileUploadStatus.isFileProcessing) {
      setSubmitBtnText(LayerSubmitButtonText.PROCESSING);
    } else if (multipartFileUploadStatus.isFileIdle) {
      setSubmitBtnText(LayerSubmitButtonText.UPDATE_LAYER);
    }
  }, [progress]);

  useEffect(() => {
    if (fileId && values.layerFile) {
      startUploading(values.layerFile);
    }
  }, [fileId]);

  useEffect(() => {
    if (multipartUploadFileResponse) {
      setFileData(multipartUploadFileResponse);
    }
  }, [multipartUploadFileResponse]);

  // Handlers.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (
      !isNil(values.type) &&
      submitBtnText === LayerSubmitButtonText.UPLOAD &&
      values.layerFile
    ) {
      sendAddFileInfoRequst({
        filename: values.layerFile.name,
        filetype: values.type.value,
      });
    } else if (
      submitBtnText === LayerSubmitButtonText.DONE ||
      submitBtnText === LayerSubmitButtonText.UPDATE_LAYER ||
      activeTabKey === layerTabs.AccessTags
    ) {
      const payload: UpdateLayer = {
        id: layerId,
        data: {},
      };

      Object.entries(dirty).map(([key, value]) => {
        if (value) {
          payload.data[key] = values[key];
        }
      });

      if (fileId) {
        payload.data.fileId = fileId;
      }

      if (!isEmpty(values.sourceId)) {
        payload.data.sourceId = values.sourceId;
      }

      sendUpdateLayerRequest(payload);
    }
  };

  const resetFile = () => {
    setFileId(null);
    setFileData(null);
    resetMultipartUpload();
  };

  const onClickCancel = () => {
    resetFile();
    setValues({
      ...values,
      layerFile: null,
    });

    if (isFileUploadOngoing) {
      cancelUpload();
    }

    onCloseSideCard();
  };

  const onTabSwitch = (tabKey: string) => {
    if (tabKey === layerTabs.AccessTags && sourceIdIsOptional) {
      setActiveTabKey(tabKey);
    } else {
      setActiveTabKey(layerTabs.Basic);
    }
  };

  const onCloseSideCard = () => {
    resetFile();
    resetAll();
    closeEditLayer();
    setActiveTabKey(layerTabs.Basic);
    resetMultipartUpload();
  };

  const onFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
    const files = event.target.files;
    if (!isNil(files)) {
      setValues({ ...values, layerFile: files[0] });
      setSubmitBtnText(LayerSubmitButtonText.UPLOAD);
    }
  };

  const showDeleteConfirmationHandler = () =>
    setShowDeleteConfirmationCard(true);

  const closeDeleteConfirmationHandler = () =>
    setShowDeleteConfirmationCard(false);

  const onDeleteFile = () => {
    setShowDeleteConfirmationCard(false);
    sendDeleteFileRequest({ id: fileData?.id, iterationId: iterationId });
  };

  const showFileCard = () => {
    if (
      values.layerFile &&
      !isNil(fileData) &&
      (fileData.status === StatusIndicatorLevel.Completed ||
        fileData.status === StatusIndicatorLevel.Done)
    ) {
      return true;
    }
    return false;
  };

  // Renders.
  const renderLayerFileInput = () => {
    if (
      !isNil(values.type) &&
      layersWithUploadedFile.includes(values.type.value)
    ) {
      return (
        <InputGroup>
          <Input.Label>{layerTypesLabel[values.type.value]} Layer</Input.Label>
          {/* We will show the file card when we the file upload is complete
          or when we fetch an already uploaded file. Incase the file is
          deleted the mbtiles field will only return file id which is why
          we are checking if it is of type string.
      */}
          {showFileCard() && fileData ? (
            <>
              <FileCard
                fileName={fileData.filename}
                fileSize={fileData.size}
                onDownloadClick={() => sendDownloadUrlRequest(fileData.id)}
                onDeleteBtnClick={showDeleteConfirmationHandler}
                showDeleteBtn={layersWithUploadedFile.includes(
                  values.type.value,
                )}
                deleteBtnDataTestId="remove-layer-file-button"
                fileCardDataTestId="edit-layer-file-card"
              />
              {showDeleteConfirmationCard && (
                <ConfirmationCard
                  title="Delete Confirmation"
                  message={`Are you sure you want to delete the ${fileData.filename} file?`}
                  onSubmit={onDeleteFile}
                  onCancel={closeDeleteConfirmationHandler}
                  submitLabel="Delete"
                  cancelLabel="Cancel"
                  onCancelBtnDataTestId="cancel-delete-layer-file-button"
                  onSubmitButtonDataTestId="confirm-delete-layer-file-button"
                />
              )}
            </>
          ) : multipartFileUploadStatus.isFileIdle ? (
            <Input.File
              accept=".mbtiles,.tif,.tiff"
              multiple={false}
              onChange={onFileSelect}
              name={names.layerFile}
              error={errors.layerFile}
              isInvalid={!!errors.layerFile}
              disabled={!layersWithUploadedFile.includes(values.type.value)}
              {...{ onBlur, onFocus }}
            />
          ) : (
            values.layerFile && (
              <>
                <small className="neutral-300-txt mb-1">
                  Status : {getProgressStatus(progress)}
                </small>
                <ProgressBar
                  now={progress}
                  variant={
                    progress === -1 ? ProgressBarVariant.Error : undefined
                  }
                />
              </>
            )
          )}
        </InputGroup>
      );
    } else if (values.type?.value === LayerType.MapBox) {
      return (
        <InputGroup className="layer-sidecard-form__layer-id__text-sm">
          <Input.Label> Source ID </Input.Label>
          <Input.Text
            placeholder="Source ID"
            value={values.sourceId}
            name={names.sourceId}
            error={errors.sourceId}
            isInvalid={!!errors.sourceId}
            disabled={values.type.value !== LayerType.MapBox}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
      );
    } else {
      return null;
    }
  };

  const renderEditLayerForm = () => {
    return isLoadingLayer ? (
      <Spinner />
    ) : (
      <form className="layer-sidecard-form" onSubmit={onSubmit}>
        <InputGroup className="layer-sidecard-form__layer-name__text-sm">
          <Input.Label> Layer Name </Input.Label>
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
        <InputGroup>
          <Input.Label> Layer Type </Input.Label>
          <RadioToggle
            value={values.type?.value}
            name={names.type}
            label={values.type?.label}
            checked={true}
            className={'layer-sidecard-form__no-toggle'}
          />
        </InputGroup>
        {renderLayerFileInput()}
      </form>
    );
  };

  return (
    <div className="edit-layers">
      <SideCard
        title="Edit Layers"
        showCloseButton={true}
        placement={SideCardLocation.End}
        show={showSideCard}
        onClose={isFileUploadOngoing ? onClickCancel : onCloseSideCard}
        className="layer-sidecard"
        footerClassName="justify-content-end"
        data-testid="edit-layer-sidecard"
        footer={
          <>
            <Button
              variant={ButtonVariant.Secondary}
              onClick={onClickCancel}
              data-testid="edit-layer-sidecard-cancel-button"
            >
              Cancel
            </Button>
            <Button
              onClick={onSubmit}
              disabled={inputHasError([names.accessTags]) || !inputIsDirty()}
              isLoading={
                isLoadingAddFile ||
                isLoadingUpdateLayer ||
                multipartFileUploadStatus.isFileUploading ||
                multipartFileUploadStatus.isFileProcessing
              }
              data-testid={`edit-layer-sidecard-${submitBtnText.toLowerCase().replace(/\s+/g, '-')}-button`}
            >
              {submitBtnText}
            </Button>
          </>
        }
      >
        <>
          {isAccessTagsTabHidden ? (
            renderEditLayerForm()
          ) : (
            <TabSwitcher
              tabComponentList={[
                {
                  label: layerTabs.Basic,
                  children: renderEditLayerForm(),
                  key: layerTabs.Basic,
                  disabled: isLoadingUpdateLayer,
                },
                {
                  label: layerTabs.AccessTags,
                  children: (
                    <AccessTags
                      accessTags={accessTags}
                      setAccessTags={setAccessTags}
                      dirty={dirty}
                      setDirty={setDirty}
                      loggedUser={loggedUser}
                      values={values}
                      setValues={setValues}
                      accessTagListResponse={accessTagListResponse?.data}
                    />
                  ),
                  key: layerTabs.AccessTags,
                },
              ]}
              activeKey={activeTabKey}
              onTabSwitch={(tabKey) => onTabSwitch(tabKey)}
            />
          )}
        </>
      </SideCard>
    </div>
  );
};
