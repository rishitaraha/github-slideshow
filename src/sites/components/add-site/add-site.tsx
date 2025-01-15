import {
  AccordionCheckBoxStatus,
  Button,
  ButtonVariant,
  getProgressStatus,
  Input,
  InputGroup,
  Placement,
  ProgressBar,
  SideCard,
  SideCardLocation,
  TabSwitcher,
} from '@aus-platform/design-system';
import { isNil } from 'lodash';
import React, { FormEvent, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { siteTabs } from '../../constants';
import { SitesOptionType } from '../../types';
import { siteInputValidator } from '../../validators';
import { SiteSubmitButtonText } from '../enums';
import { siteInputState, siteTypeOptions } from '../helpers/site-data';
import { SiteACL } from '../site-acl';
import { SiteUserGroupList } from '../site-acl/types';
import { AddSiteInput } from '../types';
import {
  FileType,
  getFileUploadStatus,
  MultiPartUploadUrls,
  useInputFields,
  useMultipartUpload,
} from 'shared/hooks';
import { AddSitePayload, useAddSite } from 'shared/api/sites';
import { handleResponseMessage, useUserGroupList } from 'shared/api';

type AddSiteProps = {
  showSideCard: boolean;
  closeAddSite: () => void;
  refetchSiteList: () => void;
};

export const AddSite: React.FC<AddSiteProps> = ({
  showSideCard,
  closeAddSite,
  refetchSiteList,
}) => {
  // States.
  const [siteId, setSiteId] = useState<string | null>();
  const [userGroups, setUserGroups] = useState<SiteUserGroupList>({});
  const [activeTabKey, setActiveTabKey] = useState(siteTabs.Basic);
  const [submitBtnTxt, setSubmitBtnTxt] = useState(
    SiteSubmitButtonText.ADD_SITE,
  );

  // Contexts.
  const { search } = useLocation();
  const projectId = new URLSearchParams(search).get('projectId');

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
  } = useInputFields<AddSiteInput>(siteInputState, siteInputValidator);

  // Api.
  const {
    mutate: sendAddSiteRequest,
    isPending: isLoadingAddSite,
    data: addSiteResponse,
    isSuccess: isSuccessAddSite,
    isError: isErrorAddSite,
    error: addSiteError,
  } = useAddSite();

  const {
    data: userGroupListResponse,
    isLoading: userGroupListIsLoading,
    isSuccess: userGroupListIsSuccess,
  } = useUserGroupList(showSideCard, {});

  const {
    progress: dsmUploadProgress,
    setUrls: setDsmMultipartUploadUrls,
    startUploading: startUploadingDsm,
    reset: resetDsmMultipartUpload,
    cancelUpload: cancelDsmUpload,
  } = useMultipartUpload({
    fileType: FileType.BaseDsm,
  });

  const {
    progress: legendImageUploadProgress,
    setUrls: setLegendImageMultipartUploadUrls,
    startUploading: startUploadingLegendImage,
    reset: resetLegendImageMultipartUpload,
    cancelUpload: cancelLegendImageUpload,
  } = useMultipartUpload({
    fileType: FileType.LegendImage,
  });

  // Constants.
  const dsmFileUploadStatus = getFileUploadStatus(dsmUploadProgress);

  const legendImageUploadStatus = getFileUploadStatus(
    legendImageUploadProgress,
  );

  const isSubmitButtonLoading =
    isLoadingAddSite ||
    dsmFileUploadStatus.isFileUploading ||
    dsmFileUploadStatus.isFileProcessing ||
    legendImageUploadStatus.isFileUploading ||
    legendImageUploadStatus.isFileProcessing;

  // UseEffects.
  useEffect(() => {
    if (isSuccessAddSite && addSiteResponse) {
      setSiteId(addSiteResponse.data.id);
      setMultiPartUploadUrls(addSiteResponse.data.id);
    }

    handleResponseMessage(
      isSuccessAddSite,
      isErrorAddSite,
      addSiteResponse,
      addSiteError,
    );
  }, [addSiteResponse, isSuccessAddSite, isErrorAddSite]);

  useEffect(() => {
    if (!isNil(siteId)) {
      if (
        !dsmFileUploadStatus.isFileUploaded &&
        values.baseDSM &&
        values.baseDSM.size > 0
      ) {
        startUploadingDsm(values.baseDSM);
        setValues({ ...values, baseDSM: null });
      }

      if (
        !legendImageUploadStatus.isFileUploaded &&
        values.legendImage &&
        values.legendImage.size > 0
      ) {
        startUploadingLegendImage(values.legendImage);
        setValues((prevValues) => ({ ...prevValues, legendImage: null }));
      }

      // Switch to active tab only if there is no legend image/ DSM.
      if (!values.baseDSM && !values.legendImage) {
        setActiveTabKey(siteTabs.AccessControl);
      }
    }
  }, [siteId]);

  useEffect(() => {
    if (userGroupListIsSuccess && userGroupListResponse) {
      const groups = userGroupListResponse.data.userGroups.reduce(
        (previousGroups, currentGroup) => {
          return {
            ...previousGroups,
            [currentGroup['id']]: {
              name: currentGroup.name,
              show: true,
              canView: false,
              canManageIterationsAndLayers: false,
              checkboxStatus: AccordionCheckBoxStatus.Unchecked,
            },
          };
        },
        {},
      );
      setUserGroups(groups);
    }
  }, [userGroupListIsSuccess, userGroupListResponse]);

  useEffect(() => {
    const showNextButton =
      dsmFileUploadStatus.isFileUploaded ||
      legendImageUploadStatus.isFileUploaded ||
      (dsmFileUploadStatus.isFileUploadError &&
        legendImageUploadStatus.isFileUploadError);

    if (showNextButton) {
      setSubmitBtnTxt(SiteSubmitButtonText.NEXT);
    } else if (
      dsmFileUploadStatus.isFileUploading ||
      legendImageUploadStatus.isFileUploading
    ) {
      setSubmitBtnTxt(SiteSubmitButtonText.UPLOADING);
    } else if (
      dsmFileUploadStatus.isFileProcessing ||
      legendImageUploadStatus.isFileProcessing
    ) {
      setSubmitBtnTxt(SiteSubmitButtonText.PROCESSING);
    } else if (
      dsmFileUploadStatus.isFileIdle ||
      legendImageUploadStatus.isFileIdle
    ) {
      setSubmitBtnTxt(SiteSubmitButtonText.ADD_SITE);
    }
  }, [legendImageUploadStatus, dsmFileUploadStatus]);

  // Handlers.
  const setMultiPartUploadUrls = (siteId: string) => {
    const multipartUploadUrls: MultiPartUploadUrls = {
      startUploadUrl: `/sites/${siteId}/upload-file/`,
      presignedUrl: `/sites/${siteId}/presigned-url/`,
      completeUploadUrl: `/sites/${siteId}/complete-upload/`,
    };

    setDsmMultipartUploadUrls(multipartUploadUrls);
    setLegendImageMultipartUploadUrls(multipartUploadUrls);
  };

  const onSiteTypeChange = (option: SitesOptionType) => {
    setValues({ ...values, siteType: option });
  };

  const onBaseFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!isNil(files)) {
      setValues({ ...values, baseDSM: files[0] });
    }
  };
  const onLegendImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!isNil(files)) {
      setValues({ ...values, legendImage: files[0] });
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (activeTabKey === siteTabs.Basic && !inputHasError() && inputIsDirty()) {
      if (submitBtnTxt == SiteSubmitButtonText.ADD_SITE) {
        const payload: AddSitePayload = {
          ...values,
          siteType: values.siteType.value,
          project: projectId ?? '',
        };
        sendAddSiteRequest(payload);
      }
    }
    if (submitBtnTxt === SiteSubmitButtonText.NEXT) {
      setActiveTabKey(siteTabs.AccessControl);
    }
  };

  const closeAddSiteSideCard = () => {
    if (siteId) {
      refetchSiteList();
    }

    // Reset multipart upload.
    if (
      !legendImageUploadStatus.isFileIdle &&
      !legendImageUploadStatus.isFileUploaded
    ) {
      cancelLegendImageUpload();
    }

    if (
      !dsmFileUploadStatus.isFileIdle &&
      !dsmFileUploadStatus.isFileUploaded
    ) {
      cancelDsmUpload();
    }

    resetDsmMultipartUpload();
    resetLegendImageMultipartUpload();

    // Reset Forms.
    setValues(siteInputState);
    setSiteId(null);
    setActiveTabKey(siteTabs.Basic);
    setSubmitBtnTxt(SiteSubmitButtonText.ADD_SITE);
    closeAddSite();
    resetAll();
  };

  const onDoneClick = (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }
    refetchSiteList();
    closeAddSiteSideCard();
  };

  // Renders.
  const renderAddSiteForm = () => {
    return (
      <form className="site-sidecard-form" onSubmit={onSubmit}>
        {/* Site Name */}
        <InputGroup className="site-sidecard-form__text-sm">
          <Input.Label>Site Name</Input.Label>
          <Input.Text
            placeholder="Site Name"
            value={values.siteName}
            name={names.siteName}
            error={errors.siteName}
            isInvalid={!!errors.siteName}
            disabled={!!siteId}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
        {/* Site Type */}
        <InputGroup className="site-sidecard-form__select-group">
          <Input.Label>Select Site Type</Input.Label>
          <Input.Select
            options={siteTypeOptions}
            defaultValue={siteTypeOptions[0]}
            value={values.siteType}
            onChange={onSiteTypeChange}
            isDisabled={!!siteId}
          />
        </InputGroup>

        {/* Base DSM File */}
        <InputGroup>
          <Input.Label>Base DSM</Input.Label>
          {!siteId || dsmFileUploadStatus.isFileIdle ? (
            <Input.File
              name="baseDSM"
              accept=".tif,.tiff"
              multiple={false}
              onChange={onBaseFileSelected}
              error={errors.baseDSM}
              isInvalid={!!errors.baseDSM}
              {...{ onBlur, onFocus }}
            />
          ) : (
            <>
              <small className="neutral-300-txt mb-1">
                Status : {getProgressStatus(dsmUploadProgress)}
              </small>
              <ProgressBar now={dsmUploadProgress} />
            </>
          )}
        </InputGroup>

        {/* Legend Image File */}
        <InputGroup>
          <Input.Label
            info="Recommended image size is 330x850"
            infoPlacement={Placement.Right}
          >
            Legend Image
          </Input.Label>
          {!siteId || legendImageUploadStatus.isFileIdle ? (
            <Input.File
              name="legendImage"
              accept=".jpeg,.jpg,.png"
              multiple={false}
              onChange={onLegendImageSelected}
              error={errors.legendImage}
              isInvalid={!!errors.legendImage}
              {...{ onBlur, onFocus }}
            />
          ) : (
            <>
              <small className="neutral-300-txt mb-1">
                Status : {getProgressStatus(legendImageUploadProgress)}
              </small>
              <ProgressBar now={legendImageUploadProgress} />
            </>
          )}
        </InputGroup>

        <InputGroup className="site-sidecard-form__location-label">
          <Input.Label>LOCATION</Input.Label>
        </InputGroup>

        <div className="site-sidecard-form__long-lat">
          {/* Longitude */}
          <InputGroup>
            <Input.Label>Longitude</Input.Label>
            <Input.Text
              placeholder="Longitude"
              value={values.longitude}
              name={names.longitude}
              error={errors.longitude}
              isInvalid={!!errors.longitude}
              disabled={!!siteId}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>

          {/* Latitude */}
          <InputGroup>
            <Input.Label>Latitude</Input.Label>
            <Input.Text
              placeholder="Latitude"
              value={values.latitude}
              name={names.latitude}
              error={errors.latitude}
              isInvalid={!!errors.latitude}
              disabled={!!siteId}
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </div>

        {/*Site Boundary - MapBox Id */}
        <InputGroup>
          <Input.Label>Site Boundary - MapBox Id</Input.Label>
          <Input.Text
            placeholder="Site Boundary"
            value={values.siteBoundary}
            name={names.siteBoundary}
            error={errors.siteBoundary}
            isInvalid={!!errors.siteBoundary}
            disabled={!!siteId}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
      </form>
    );
  };

  // Render.
  return (
    <SideCard
      title="Add Site"
      showCloseButton={true}
      placement={SideCardLocation.End}
      show={showSideCard}
      onClose={closeAddSiteSideCard}
      className="sidecard-with-tabs site-sidecard"
      footerClassName="justify-content-end"
      data-testid="add-site-side-card"
      footer={
        <>
          {activeTabKey === siteTabs.AccessControl ? (
            <Button
              type="button"
              onClick={onDoneClick}
              data-testid="add-site-done-btn"
            >
              {SiteSubmitButtonText.DONE}
            </Button>
          ) : (
            <>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={closeAddSiteSideCard}
              >
                {SiteSubmitButtonText.CANCEL}
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitButtonLoading}
                disabled={inputHasError()}
                onClick={onSubmit}
                data-testid="test-add-site-btn-side-card"
              >
                {submitBtnTxt}
              </Button>
            </>
          )}
        </>
      }
    >
      <TabSwitcher
        className="disable-tab-switching"
        tabComponentList={[
          {
            label: siteTabs.Basic,
            children: renderAddSiteForm(),
            key: siteTabs.Basic,
          },
          {
            label: siteTabs.AccessControl,
            children: (
              <SiteACL
                userGroups={userGroups}
                siteId={addSiteResponse?.data.id}
                isLoading={userGroupListIsLoading}
                totalUserGroups={userGroupListResponse?.data.total || 0}
              />
            ),
            key: siteTabs.AccessControl,
          },
        ]}
        activeKey={activeTabKey}
      />
    </SideCard>
  );
};
