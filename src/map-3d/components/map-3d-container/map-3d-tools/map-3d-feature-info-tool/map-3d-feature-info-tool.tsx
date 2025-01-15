import {
  Button,
  Fab,
  IconIdentifier,
  ImageUpload,
  Input,
  InputGroup,
  Placement,
  SideCard,
  SideCardLocation,
  Spinner,
  Tooltip,
} from '@aus-platform/design-system';
import { isEmpty, isNil, isNull, isUndefined } from 'lodash';
import React, { useEffect, useState } from 'react';
import { Table } from 'react-bootstrap';
import { useAppDispatch, useAppSelector } from '../../../../../app/hooks';
import {
  handleResponseErrorMessage,
  handleResponseMessage,
  useFeatureInfo,
  useUpdateFeatureInfo,
} from '../../../../../shared/api';
import { useDeleteImage } from '../../../../../shared/api/features';
import {
  ConfirmationModal,
  ImagePreviewModal,
} from '../../../../../shared/components';
import { fillArray } from '../../../../../shared/helpers';
import { useInputFields } from '../../../../../shared/hooks';
import {
  WorkspaceRightSideCard,
  destroyMeasureTool,
  selectMap3DState,
  selectMap3dWorkspace,
  setCurrentActiveMapTool,
  setRightSideCard,
} from '../../../../shared/map-3d-slices';
import { FeatureInfoTool } from '../../../../shared/map-3d-tools';
import { ToolEvent } from '../../../../shared/map-3d-tools/enums';
import { IFeatureInfoTool } from '../../../../shared/map-3d-tools/interfaces';
import { MapTool } from '../enums';
import {
  FeatureImagePreviewerStateType,
  FeatureInfoImageObjectType,
  FeatureInfoInputType,
} from './types';

/**
 * imageSource will either contain the base64String if the image is not uploaded.
 * Or it will contain the imageS3Key, if image is fetched from backend.
 */
const initialImageState: FeatureInfoImageObjectType = {
  imageFile: null,
  isUploaded: false,
  imageSource: null,
  thumbnailSource: null,
  id: '',
  name: '',
};

const featureInfoInitialInputState: FeatureInfoInputType = {
  featureId: '',
  featureInformation: '',
  featureImages: fillArray(3, initialImageState),
};

export const FeatureInfo: React.FC = () => {
  // Dispatcher.
  const dispatch = useAppDispatch();

  // Selector.
  const {
    cesiumProxy,
    currentActiveMapTool,
    isElevationProfileSelectLayersActive,
  } = useAppSelector(selectMap3DState);
  const { drawingTools, rightSideCard, workspaceLayers } =
    useAppSelector(selectMap3dWorkspace);

  // State.
  const [imageIdToBeDeleted, setImageIdToBeDeleted] = useState<string | null>();
  const [featureImagePreviewerModal, setFeatureImagePreviewerModal] =
    useState<FeatureImagePreviewerStateType>({
      show: false,
      selectedImageIndex: null,
      selectedFeatureImage: null,
    });
  const [attributes, setAttributes] = useState<Record<string, any>>();
  const [featureInfoTool, setFeatureInfoTool] = useState<IFeatureInfoTool>();

  // Hooks.
  const {
    values,
    names,
    errors,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
    optional,
    setOptional,
    getOptionalFields,
  } = useInputFields<FeatureInfoInputType>(featureInfoInitialInputState);

  // APIs.
  const {
    data: featureInfoResponse,
    isSuccess: isSuccessFeatureInfoResponse,
    isLoading: isLoadingFeatureInfoResponse,
    isError: isErrorFeatureInfoResponse,
    error: featureInfoResponseError,
  } = useFeatureInfo(values.featureId, !isEmpty(values.featureId));

  const {
    mutate: sendUpdateFeatureInfoRequest,
    data: updateFeatureInfoResponse,
    isError: isErrorUpdateFeatureInfo,
    isSuccess: isSuccessUpdateFeatureInfo,
    error: updateFeatureInfoError,
    isPending: isLoadingUpdateFeatureInfo,
  } = useUpdateFeatureInfo();

  const {
    mutate: sendDeleteImageRequest,
    isError: isErrorDeleteImageRequest,
    isSuccess: isSuccessDeleteImageRequest,
    error: deleteImageRequestError,
    data: deleteImageRequestData,
    isPending: isLoadingDeleteImageRequest,
  } = useDeleteImage();

  // Event listeners.
  const onFeatureFocusListener = ([featureId]) => {
    // Disable the feature info tool for drawn features that don't belong to any layer.
    if (
      drawingTools?.featureExists(featureId) &&
      !drawingTools?.featureHasProperty(featureId, 'layerId')
    ) {
      return;
    }

    if (currentActiveMapTool === MapTool.FeatureTool) {
      setValues({
        ...values,
        featureId,
      });
    }
  };

  const onFeatureBlurListener = () => {
    setValues(featureInfoInitialInputState);
    resetAll();
    setAttributes(undefined);
  };

  // Constants.
  const hasManageLayerPermission = featureInfoResponse
    ? workspaceLayers[featureInfoResponse.data.layer].canManageLayer
    : false;

  // useEffects.
  useEffect(() => {
    if (currentActiveMapTool !== MapTool.FeatureTool) {
      featureInfoTool?.deactivate();
      setValues(featureInfoInitialInputState);
      dispatch(setRightSideCard(WorkspaceRightSideCard.None));
    } else if (currentActiveMapTool === MapTool.FeatureTool) {
      featureInfoTool?.activate();
    }
  }, [currentActiveMapTool]);

  useEffect(() => {
    setOptional({
      ...optional,
      featureInformation: true,
      featureImages: true,
    });

    if (!isEmpty(values.featureId)) {
      dispatch(setRightSideCard(WorkspaceRightSideCard.FeatureInfo));
    } else {
      dispatch(setRightSideCard(WorkspaceRightSideCard.None));
    }
  }, [values.featureId]);

  useEffect(() => {
    if (!cesiumProxy?.viewer) {
      return;
    }

    const featureInfoTool = new FeatureInfoTool(cesiumProxy.cesiumViewer);

    setFeatureInfoTool(featureInfoTool);

    featureInfoTool.addEventListener(ToolEvent.Blur, onFeatureBlurListener);
    featureInfoTool.addEventListener(ToolEvent.Focus, onFeatureFocusListener);

    return () => {
      featureInfoTool.removeEventListener(
        ToolEvent.Blur,
        onFeatureBlurListener,
      );
      featureInfoTool.removeEventListener(
        ToolEvent.Focus,
        onFeatureFocusListener,
      );
    };
  }, [cesiumProxy?.viewer, drawingTools, values, currentActiveMapTool]);

  useEffect(() => {
    if (featureInfoResponse && isSuccessFeatureInfoResponse) {
      const featureImageArray = featureInfoResponse.data.images?.map(
        (image) => {
          return {
            ...image,
            isUploaded: true,
            imageFile: null,
            imageSource: image.imageS3Key,
            thumbnailSource: image.thumbnailS3Key,
          };
        },
      );

      if (!isNil(featureImageArray)) {
        setValues({
          ...values,
          // Text area's value should always be a string even if the value is empty.
          featureInformation: featureInfoResponse.data.info ?? '',
          featureImages:
            featureImageArray.length < 3
              ? [
                  ...featureImageArray,
                  ...fillArray(3 - featureImageArray.length, initialImageState),
                ]
              : featureImageArray,
        });
      }
      if (!isNil(featureInfoResponse.data.attributes)) {
        setAttributes(featureInfoResponse.data.attributes);
      }
    }
    handleResponseErrorMessage(
      isErrorFeatureInfoResponse,
      featureInfoResponseError,
    );
  }, [
    isSuccessFeatureInfoResponse,
    featureInfoResponse,
    isErrorFeatureInfoResponse,
    featureInfoResponseError,
  ]);

  useEffect(() => {
    if (isSuccessUpdateFeatureInfo && updateFeatureInfoResponse) {
      const featureImageArray = updateFeatureInfoResponse.data.images?.map(
        (image) => {
          return {
            ...image,
            imageSource: image.imageS3Key,
            thumbnailSource: image.thumbnailS3Key,
            isUploaded: true,
            imageFile: null,
          };
        },
      );

      if (!isNil(featureImageArray)) {
        setValues({
          ...values,
          featureInformation: updateFeatureInfoResponse.data.info ?? '',
          // Fill array with init state, when the images in be is less than 3.
          featureImages:
            featureImageArray.length < 3
              ? [
                  ...featureImageArray,
                  ...fillArray(3 - featureImageArray.length, initialImageState),
                ]
              : featureImageArray,
        });
      }
    }
    handleResponseMessage(
      isSuccessUpdateFeatureInfo,
      isErrorUpdateFeatureInfo,
      updateFeatureInfoResponse,
      updateFeatureInfoError,
    );
  }, [isSuccessUpdateFeatureInfo, isErrorUpdateFeatureInfo]);

  useEffect(() => {
    if (isSuccessDeleteImageRequest) {
      setValues((prevValue) => {
        const images = prevValue.featureImages.map((featureImage) => {
          if (featureImage.id === imageIdToBeDeleted) {
            return { ...initialImageState };
          }
          return featureImage;
        });

        return {
          ...prevValue,
          featureImages: images,
        };
      });

      setImageIdToBeDeleted(null);
    }
    handleResponseMessage(
      isSuccessDeleteImageRequest,
      isErrorDeleteImageRequest,
      deleteImageRequestData,
      deleteImageRequestError,
    );
  }, [isSuccessDeleteImageRequest, isErrorDeleteImageRequest]);

  // Handlers.
  const displayFeatureImagePreviewModal = (imageIndex: number) => {
    setFeatureImagePreviewerModal({
      show: true,
      selectedImageIndex: imageIndex,
      selectedFeatureImage: values.featureImages?.[imageIndex],
    });
  };

  const hideFeatureImagePreviewModal = () => {
    setFeatureImagePreviewerModal((prev) => ({
      ...prev,
      show: false,
    }));
  };

  const onImagePreviewerLoadSuccessHandler = () => {
    setFeatureImagePreviewerModal((prev) => ({ ...prev, isLoading: false }));
  };

  const onClickNextImagePreviewModalHandler = () => {
    const { selectedImageIndex } = featureImagePreviewerModal;

    // If we are already at last image, do nothing.
    if (isNull(selectedImageIndex) || selectedImageIndex > 1) {
      return;
    }

    let updatedFeatureImageIndex = selectedImageIndex;
    const nextPopulatedFeatureImageObject = values.featureImages
      .slice(selectedImageIndex + 1)
      .find((featureImageObject) => {
        updatedFeatureImageIndex++;

        return !isNull(featureImageObject.imageSource);
      });

    if (!isUndefined(nextPopulatedFeatureImageObject)) {
      setFeatureImagePreviewerModal({
        show: true,
        selectedImageIndex: updatedFeatureImageIndex,
        selectedFeatureImage: nextPopulatedFeatureImageObject,
      });
    }
  };

  const onClickPreviousImagePreviewModalHandler = () => {
    const { selectedImageIndex } = featureImagePreviewerModal;

    // If we are already at first image, do nothing.
    if (isNull(selectedImageIndex) || selectedImageIndex < 1) {
      return;
    }

    let updatedFeatureImageIndex = selectedImageIndex;
    const previousPopulatedFeatureImageObject = values.featureImages
      .slice(0, selectedImageIndex)
      .reverse()
      .find((featureImageObject) => {
        updatedFeatureImageIndex--;

        return (
          !isNull(featureImageObject.imageSource) ||
          !isNull(featureImageObject.imageFile)
        );
      });

    if (!isUndefined(previousPopulatedFeatureImageObject)) {
      setFeatureImagePreviewerModal({
        show: true,
        selectedImageIndex: updatedFeatureImageIndex,
        selectedFeatureImage: previousPopulatedFeatureImageObject,
      });
    }
  };

  const onFeatureInfoToolClick = () => {
    if (!featureInfoTool) {
      return;
    }

    if (currentActiveMapTool === MapTool.MeasureTool) {
      destroyMeasureTool();
      dispatch(setCurrentActiveMapTool(MapTool.FeatureTool));
    }

    if (currentActiveMapTool === MapTool.FeatureTool) {
      dispatch(setCurrentActiveMapTool(MapTool.None));
    } else {
      dispatch(setCurrentActiveMapTool(MapTool.FeatureTool));
    }
  };

  const onCloseFeatureInfoSideCard = () => {
    setValues(featureInfoInitialInputState);
    setAttributes(undefined);
  };

  const onSubmit = (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    event.preventDefault();
    if (!inputHasError(getOptionalFields()) && inputIsDirty()) {
      sendUpdateFeatureInfoRequest({
        id: values.featureId,
        info: values.featureInformation,
        // To not include null values.
        images: values.featureImages?.reduce(
          (prevFeatureImagesList: File[], currentFeatureImage) => {
            if (!isNull(currentFeatureImage.imageFile)) {
              prevFeatureImagesList.push(currentFeatureImage.imageFile);
            }
            return prevFeatureImagesList;
          },
          [],
        ),
      });
    }
  };

  const onFeatureImageChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    imageIndex: number,
  ) => {
    onChange(event);
    const file = event.target.files?.[0];
    // Add image to particular index even if an image is already uploaded in that field.
    const featureImageObject = values.featureImages;

    if (!isNil(file)) {
      featureImageObject[imageIndex].imageFile = file;
      featureImageObject[imageIndex].name = file.name;
      featureImageObject[imageIndex].isUploaded = false;

      // @TODO: Handle converting image into base64 in a hook to avoid repetition in multiple components.
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const imageBase64String = String(reader.result);
        // Setting the image URL when file is selected.
        featureImageObject[imageIndex].imageSource = imageBase64String;
        featureImageObject[imageIndex].thumbnailSource = imageBase64String;

        setValues({
          ...values,
          featureImages: featureImageObject,
        });
      };
    }
  };

  const onFeatureImageDelete = (imageIndex: number) => {
    const image = values.featureImages[imageIndex];
    /**
     * Handle soft deletion of images.
     * In case user deletes an image which hasn't been uploaded yet.
     * On clicking update, the form would update with the soft-deleted images. Thus, preventing that.
     */
    if (!image.isUploaded) {
      setValues((prevValue) => {
        const images = prevValue.featureImages;
        images[imageIndex] = { ...initialImageState };
        return {
          ...prevValue,
          featureImages: images,
        };
      });
    }

    if (image.isUploaded) {
      setImageIdToBeDeleted(image.id);
    }
  };

  return (
    <>
      <div className="map-3d-tools map-3d-tools--feature-info">
        <Tooltip hoverText="Inspect" placement={Placement.Right}>
          <Fab
            leftIconIdentifier={IconIdentifier.InfoCircle}
            onClick={onFeatureInfoToolClick}
            active={currentActiveMapTool === MapTool.FeatureTool}
            disabled={isElevationProfileSelectLayersActive}
          />
        </Tooltip>
      </div>

      <SideCard
        show={rightSideCard === WorkspaceRightSideCard.FeatureInfo}
        showCloseButton={true}
        title="Feature Info"
        placement={SideCardLocation.End}
        onClose={onCloseFeatureInfoSideCard}
        className="map-3d-feature-info-sidecard"
        backdrop={false}
        footer={
          <Button
            className="ms-auto"
            disabled={inputHasError(getOptionalFields()) || !inputIsDirty()}
            onClick={onSubmit}
            isLoading={isLoadingUpdateFeatureInfo}
          >
            Update
          </Button>
        }
      >
        {isLoadingFeatureInfoResponse ? (
          <Spinner />
        ) : (
          <div className="map-3d-feature-info-sidecard__form">
            <InputGroup>
              <Input.Label>Feature ID</Input.Label>
              <Input.Text
                value={values.featureId}
                name={names.featureId}
                error={errors.featureId}
                isInvalid={!!errors.featureId}
                disabled
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup>
              <Input.Label>Feature Information</Input.Label>
              <Input.TextArea
                disabled={!hasManageLayerPermission}
                placeholder="Feature Information"
                value={values.featureInformation}
                name={names.featureInformation}
                error={errors.featureInformation}
                isInvalid={!!errors.featureInformation}
                {...{ onChange, onBlur, onFocus }}
              />
            </InputGroup>
            <InputGroup>
              <Input.Label>Feature Images</Input.Label>
              <div className="map-3d-feature-info-sidecard__image-container">
                {!isNil(imageIdToBeDeleted) && (
                  <ConfirmationModal
                    message="Are you sure you want to delete this image?"
                    onSubmit={() => {
                      sendDeleteImageRequest(imageIdToBeDeleted);
                    }}
                    onClose={() => {
                      setImageIdToBeDeleted(null);
                    }}
                  />
                )}
                {Array(3)
                  .fill(null)
                  .map((_, index) => (
                    <ImageUpload
                      disabled={!hasManageLayerPermission}
                      key={index}
                      name={names.featureImages}
                      onChange={(event) => {
                        onFeatureImageChange(event, index);
                      }}
                      onDelete={() => onFeatureImageDelete(index)}
                      isLoading={
                        isLoadingUpdateFeatureInfo ||
                        isLoadingDeleteImageRequest ||
                        isLoadingFeatureInfoResponse
                      }
                      imageSrc={values.featureImages[index]?.thumbnailSource}
                      onClickView={() => displayFeatureImagePreviewModal(index)}
                    />
                  ))}
              </div>
            </InputGroup>

            {/* Attribute table */}
            <InputGroup className="w-100">
              <Input.Label>Attributes</Input.Label>
              <div className="map-3d-feature-info-sidecard__attribute-table__container">
                {attributes ? (
                  <Table
                    bordered
                    hover
                    responsive
                    size="sm"
                    className="map-3d-feature-info-sidecard__attribute-table"
                  >
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(attributes).map(([key, value], index) => (
                        <tr key={index}>
                          <td>{key}</td>
                          <td>{value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                ) : (
                  <span className="empty">No attribute is present.</span>
                )}
              </div>
            </InputGroup>
          </div>
        )}

        <ImagePreviewModal
          show={featureImagePreviewerModal.show}
          onClose={hideFeatureImagePreviewModal}
          source={
            featureImagePreviewerModal.selectedFeatureImage?.imageSource || ''
          }
          title={featureImagePreviewerModal.selectedFeatureImage?.name || ''}
          onClickNextImage={onClickNextImagePreviewModalHandler}
          onClickPreviousImage={onClickPreviousImagePreviewModalHandler}
          onImageLoadSuccess={onImagePreviewerLoadSuccessHandler}
        />
      </SideCard>
    </>
  );
};
