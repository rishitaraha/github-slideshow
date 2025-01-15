import {
  AccordionCheckBoxStatus,
  Button,
  ButtonVariant,
  Input,
  InputGroup,
  Placement,
  ProgressBar,
  SideCard,
  SideCardLocation,
  Spinner,
  TabSwitcher,
  getCheckboxStatus,
  getProgressStatus,
} from '@aus-platform/design-system';
import { isNil, isNull, isUndefined } from 'lodash';
import React, { FormEvent, useContext, useEffect, useState } from 'react';

import classNames from 'classnames';
import { siteTabs } from '../../constants';
import { SitePermission } from '../../enums';
import { SitesOptionType } from '../../types';
import { siteInputValidator } from '../../validators';
import { AccessType, SiteSubmitButtonText } from '../enums';
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
import { isOrgAdmin } from 'shared/helpers';
import { FileStatus } from 'shared/enums';
import { GlobalContext } from 'shared/context';
import { FileCard } from 'shared/components/file-card/file-card';
import { ConfirmationCard } from 'shared/components/cards';
import {
  handleResponseMessage,
  useDeleteBaseDSM,
  useDeleteSiteLegendImage,
  useFileDownload,
  useSite,
  useUpdateSite,
  useUserGroupList,
} from 'shared/api';

type EditSiteProps = {
  showSideCard: boolean;
  closeEditSite: () => void;
  refetchSite?: () => void;
  siteId: string;
  resetSiteId: () => void;
};

export const EditSite: React.FC<EditSiteProps> = ({
  showSideCard,
  closeEditSite,
  refetchSite,
  siteId,
  resetSiteId,
}) => {
  // States.
  const [showDeleteDSMConfirmationCard, setShowDeleteDSMConfirmationCard] =
    useState(false);
  const [
    showLegendDeleteConfirmationCard,
    setShowLegendDeleteConfirmationCard,
  ] = useState(false);

  const [activeTabKey, setActiveTabKey] = useState(siteTabs.Basic);
  const [userGroups, setUserGroups] = useState<SiteUserGroupList>({});
  const [selectedUserGroupsCount, setSelectedUserGroupsCount] = useState(0);

  // Contexts.
  const { loggedUser } = useContext(GlobalContext);
  const isUserAdmin = isOrgAdmin(loggedUser);

  // Hooks.
  const {
    values,
    names,
    errors,
    dirty,
    setDirty,
    setValues,
    onChange,
    onBlur,
    onFocus,
    inputHasError,
    inputIsDirty,
    resetAll,
  } = useInputFields<AddSiteInput>(siteInputState, siteInputValidator);

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

  // Api's.
  const {
    data: userGroupListResponse,
    isLoading: userGroupListIsLoading,
    isSuccess: userGroupListIsSuccess,
  } = useUserGroupList(showSideCard && isUserAdmin, {});

  const {
    data: siteResponse,
    isSuccess: siteResponseIsSuccess,
    isLoading: siteResponseIsLoading,
    refetch: refetchCurrentSite,
  } = useSite(showSideCard, {
    siteId: siteId,
  });

  const {
    mutate: sendUpdateSiteRequest,
    data: updateSiteResponse,
    isError: isErrorUpdateSite,
    isSuccess: isSuccessUpdateSite,
    error: updateSiteErrorResponse,
    reset: resetUpdateSite,
  } = useUpdateSite();

  const {
    mutate: sendDeleteDSMFileRequest,
    isSuccess: isSuccessDeleteDSMFile,
  } = useDeleteBaseDSM();

  const {
    mutate: sendDeleteSiteLegendImage,
    isSuccess: isSuccessDeleteLegendImage,
  } = useDeleteSiteLegendImage();

  const {
    mutate: sendDownloadUrlRequest,
    data: downloadFileResponse,
    isSuccess: isSuccessFileDownloadResponse,
  } = useFileDownload();

  // Constants.
  const customClassNames = classNames('site-sidecard', {
    'sidecard-with-tabs': isUserAdmin,
  });

  const dsmFileUploadStatus = getFileUploadStatus(dsmUploadProgress);

  const legendImageUploadStatus = getFileUploadStatus(
    legendImageUploadProgress,
  );

  const isSubmitLoading =
    siteResponseIsLoading ||
    dsmFileUploadStatus.isFileUploading ||
    dsmFileUploadStatus.isFileProcessing ||
    legendImageUploadStatus.isFileUploading ||
    legendImageUploadStatus.isFileProcessing;

  /*
   Done button will be visible to users in three scenarios :-
    i) Either the file uploaded and the upload is success.
    ii) User is org admin: and the user is currently in access control tab.
    iii) Once multipart upload for a file is started, 
         it's dirty flag is set to false. 
         (thus done is eventually displayed when file upload is completed)
         when another file is again selected (one file has already been uploaded)
         the Update Site button will be visible. (which will go away once multipart upload is started.)
  */
  const isDoneBtnVisible =
    (isUserAdmin && activeTabKey === siteTabs.AccessControl) ||
    (!inputIsDirty() &&
      ((dsmFileUploadStatus.isFileUploaded &&
        !legendImageUploadStatus.isFileProcessing &&
        !legendImageUploadStatus.isFileUploading) ||
        (legendImageUploadStatus.isFileUploaded &&
          !dsmFileUploadStatus.isFileProcessing &&
          !dsmFileUploadStatus.isFileUploading)));

  // UseEffects.
  useEffect(() => {
    if (isSuccessDeleteDSMFile) {
      closeBaseDSMDeleteConfirmation();
      refetchCurrentSite();
    }
  }, [isSuccessDeleteDSMFile]);

  useEffect(() => {
    if (isSuccessDeleteLegendImage) {
      setShowLegendDeleteConfirmationCard(false);
      refetchCurrentSite();
    }
  }, [isSuccessDeleteLegendImage]);

  useEffect(() => {
    if (siteId) {
      const multipartUploadUrls: MultiPartUploadUrls = {
        startUploadUrl: `/sites/${siteId}/upload-file/`,
        presignedUrl: `/sites/${siteId}/presigned-url/`,
        completeUploadUrl: `/sites/${siteId}/complete-upload/`,
      };

      setDsmMultipartUploadUrls(multipartUploadUrls);
      setLegendImageMultipartUploadUrls(multipartUploadUrls);
    }
  }, [siteId]);

  useEffect(() => {
    if (isSuccessUpdateSite && updateSiteResponse) {
      handleResponseMessage(
        isSuccessUpdateSite,
        isErrorUpdateSite,
        updateSiteResponse,
        updateSiteErrorResponse,
      );
    }
  }, [isSuccessUpdateSite, isErrorUpdateSite]);

  useEffect(() => {
    if (siteResponse && siteResponseIsSuccess) {
      const sitePermissions = siteResponse?.data.permissions;
      setValues({
        ...siteResponse.data,
        baseDSM: siteResponse.data.baseDSM
          ? new File([], siteResponse.data.baseDSM.name)
          : null,
        legendImage: siteResponse.data.legendImage
          ? new File([], siteResponse.data.legendImage.name)
          : null,
      });
      if (
        isUserAdmin &&
        userGroupListIsSuccess &&
        !isNil(sitePermissions) &&
        userGroupListResponse
      ) {
        let selectedUserGroupsCount = 0;
        // Iterating user group list and check if the permission exist for user.
        const groups = userGroupListResponse.data.userGroups.reduce(
          (previousGroups, currentGroup) => {
            let accessType: AccessType | undefined;
            if (!isUndefined(sitePermissions[currentGroup.id])) {
              currentGroup[SitePermission.canView] =
                sitePermissions[currentGroup.id].canView;
              currentGroup[SitePermission.canManageIterationsAndLayers] =
                sitePermissions[currentGroup.id].canManageIterationsAndLayers;
              accessType = sitePermissions[currentGroup.id].accessType;
              // If the currentGroup has any of the permission increase counter.
              if (
                getCheckboxStatus([
                  currentGroup[SitePermission.canView],
                  currentGroup[SitePermission.canManageIterationsAndLayers],
                ]) !== AccordionCheckBoxStatus.Unchecked
              ) {
                selectedUserGroupsCount++;
              }
            }

            if (isUndefined(currentGroup[SitePermission.canView])) {
              currentGroup[SitePermission.canView] = false;
            }

            if (
              isUndefined(
                currentGroup[SitePermission.canManageIterationsAndLayers],
              )
            ) {
              currentGroup[SitePermission.canManageIterationsAndLayers] = false;
            }

            return {
              ...previousGroups,
              [currentGroup.id]: {
                name: currentGroup.name,
                show: true,
                canView: currentGroup[SitePermission.canView],
                canManageIterationsAndLayers:
                  currentGroup[SitePermission.canManageIterationsAndLayers],
                accessType: accessType,
                checkboxStatus: getCheckboxStatus([
                  currentGroup[SitePermission.canView],
                  currentGroup[SitePermission.canManageIterationsAndLayers],
                ]),
              },
            };
          },
          {},
        );
        setUserGroups(groups);
        setSelectedUserGroupsCount(selectedUserGroupsCount);
      }
    }
  }, [
    userGroupListIsSuccess,
    userGroupListResponse,
    siteResponseIsSuccess,
    siteResponse,
  ]);

  useEffect(() => {
    if (isSuccessFileDownloadResponse && downloadFileResponse?.downloadUrl) {
      window.location.href = downloadFileResponse.downloadUrl;
    }
  }, [isSuccessFileDownloadResponse, downloadFileResponse]);

  // Handlers.
  const onSiteTypeChange = (option: SitesOptionType) => {
    setValues({ ...values, siteType: option });
    setDirty({ ...dirty, siteType: true });
  };

  const onBaseFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    onChange(event);
    const files = event.target.files;
    if (!isNull(files)) {
      setValues({ ...values, baseDSM: files[0] });
    }
  };

  const onLegendImageSelected = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    onChange(event);
    const files = event.target.files;
    if (!isNull(files)) {
      setValues({ ...values, legendImage: files[0] });
    }
  };

  const showBaseDSMDeleteConfirmation = () =>
    setShowDeleteDSMConfirmationCard(true);

  const closeBaseDSMDeleteConfirmation = () =>
    setShowDeleteDSMConfirmationCard(false);

  const deleteBaseDSM = () => {
    if (siteId) {
      sendDeleteDSMFileRequest({ siteId });
      resetDsmMultipartUpload(false);
    }
  };

  const deleteLegendImage = () => {
    if (siteId) {
      sendDeleteSiteLegendImage({ siteId });
      resetLegendImageMultipartUpload(false);
    }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (activeTabKey === siteTabs.Basic) {
      if (!inputHasError() && inputIsDirty()) {
        sendUpdateSiteRequest({
          payload: { ...values, siteType: values.siteType.value },
          siteId,
        });

        if (
          !dsmFileUploadStatus.isFileUploaded &&
          values.baseDSM &&
          values.baseDSM.size > 0
        ) {
          startUploadingDsm(values.baseDSM);
          setDirty({ ...dirty, baseDSM: false });
        }

        if (
          !legendImageUploadStatus.isFileUploaded &&
          values.legendImage &&
          values.legendImage.size > 0
        ) {
          startUploadingLegendImage(values.legendImage);
          setDirty((prevDirty) => ({ ...prevDirty, legendImage: false }));
        }
      } else if (isUserAdmin && isSuccessUpdateSite) {
        setActiveTabKey(siteTabs.AccessControl);
      } else if (!inputHasError()) {
        closeSideCard();
      }
    } else {
      resetEditSiteSideCard();
    }
  };

  const onDoneClick = (event?: FormEvent) => {
    if (event) {
      event.preventDefault();
    }

    closeEditSite();
    setValues(siteInputState);

    setActiveTabKey(siteTabs.Basic);
    refetchSite?.();
    resetSiteId();
    resetUpdateSite();
    resetAll();

    resetDsmMultipartUpload();
    resetLegendImageMultipartUpload();
  };

  const closeSideCard = () => {
    if (
      !dsmFileUploadStatus.isFileIdle &&
      !dsmFileUploadStatus.isFileUploaded
    ) {
      cancelDsmUpload();
    }

    if (
      !legendImageUploadStatus.isFileIdle &&
      !legendImageUploadStatus.isFileUploaded
    ) {
      cancelLegendImageUpload();
    }

    onDoneClick();
  };

  const resetEditSiteSideCard = () => {
    closeEditSite();
    setActiveTabKey(siteTabs.Basic);
  };

  const handleSubmitBtnText = () => {
    if (inputIsDirty()) {
      return SiteSubmitButtonText.UPDATE_SITE;
    } else if (
      dsmFileUploadStatus.isFileUploading ||
      legendImageUploadStatus.isFileUploading
    ) {
      return SiteSubmitButtonText.UPLOADING;
    } else if (
      dsmFileUploadStatus.isFileProcessing ||
      legendImageUploadStatus.isFileProcessing
    ) {
      return SiteSubmitButtonText.PROCESSING;
    } else if (isUserAdmin && isSuccessUpdateSite) {
      return SiteSubmitButtonText.NEXT;
    } else {
      return SiteSubmitButtonText.UPDATE_SITE;
    }
  };

  // Render.
  const renderEditSiteForm = () => {
    return siteResponseIsLoading ? (
      <Spinner />
    ) : (
      <form className="site-sidecard-form" onSubmit={onSubmit}>
        {/* Site Name */}
        <InputGroup>
          <Input.Label>Site Name</Input.Label>
          <Input.Text
            placeholder="Site Name"
            value={values.siteName}
            name={names.siteName}
            error={errors.siteName}
            isInvalid={!!errors.siteName}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>

        {/* Site Type */}
        <InputGroup>
          <Input.Label>Select Site Type</Input.Label>
          <Input.Select
            options={siteTypeOptions}
            defaultValue={siteTypeOptions[0]}
            value={values.siteType}
            onChange={onSiteTypeChange}
          />
        </InputGroup>

        {/* Base DSM File */}
        <InputGroup>
          <Input.Label>Base DSM</Input.Label>
          {siteResponse?.data.baseDSM?.status === FileStatus.Done &&
          siteResponse.data.baseDSM.size &&
          siteResponse.data.baseDSM.downloadUrl &&
          siteResponse.data.baseDSM.id ? (
            <>
              <FileCard
                fileName={siteResponse.data.baseDSM.name}
                fileSize={siteResponse.data.baseDSM.size}
                onDownloadClick={() =>
                  sendDownloadUrlRequest(siteResponse.data.baseDSM!.id)
                }
                onDeleteBtnClick={showBaseDSMDeleteConfirmation}
                deleteBtnDataTestId="remove-dsm-site-btn"
              />
              {showDeleteDSMConfirmationCard && (
                <ConfirmationCard
                  title="Delete Confirmation"
                  message="Are you sure you want to delete base .tif file?"
                  onSubmit={deleteBaseDSM}
                  onCancel={closeBaseDSMDeleteConfirmation}
                  submitLabel="Delete"
                  cancelLabel="Cancel"
                  onSubmitButtonDataTestId="confirm-delete-dsm-site-btn"
                />
              )}
            </>
          ) : dsmFileUploadStatus.isFileIdle ? (
            <Input.File
              name="baseDSM"
              accept=".tif,.tiff"
              multiple={false}
              disabled={legendImageUploadStatus.isFileUploading}
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
          {siteResponse?.data.legendImage?.status === FileStatus.Done &&
          siteResponse.data.legendImage.size &&
          siteResponse.data.legendImage.downloadUrl &&
          siteResponse.data.legendImage.id ? (
            <>
              <FileCard
                fileName={siteResponse.data.legendImage.name}
                fileSize={siteResponse.data.legendImage.size}
                onDownloadClick={() =>
                  sendDownloadUrlRequest(siteResponse.data.legendImage!.id)
                }
                onDeleteBtnClick={() =>
                  setShowLegendDeleteConfirmationCard(true)
                }
                deleteBtnDataTestId="remove-legend-site-btn"
              />
              {showLegendDeleteConfirmationCard && (
                <ConfirmationCard
                  title="Delete Confirmation"
                  message="Are you sure you want to delete legend Image file?"
                  onSubmit={deleteLegendImage}
                  onCancel={() => setShowLegendDeleteConfirmationCard(false)}
                  submitLabel="Delete"
                  cancelLabel="Cancel"
                  onSubmitButtonDataTestId="confirm-delete-legend-site-btn"
                />
              )}
            </>
          ) : legendImageUploadStatus.isFileIdle ? (
            <Input.File
              name="legendImage"
              accept=".jpg,.jpeg,.png"
              multiple={false}
              onChange={onLegendImageSelected}
              disabled={dsmFileUploadStatus.isFileUploading}
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
              {...{ onChange, onBlur, onFocus }}
            />
          </InputGroup>
        </div>

        {/*Site Boundary - MapBox Id */}
        <InputGroup>
          <Input.Label>Site Boundary - MapBox Id</Input.Label>
          <Input.Text
            placeholder="Site Boundary"
            value={values.siteBoundary ?? ''}
            name={names.siteBoundary}
            error={errors.siteBoundary}
            isInvalid={!!errors.siteBoundary}
            {...{ onChange, onBlur, onFocus }}
          />
        </InputGroup>
      </form>
    );
  };

  return (
    <SideCard
      title={'Edit Site'}
      showCloseButton={true}
      placement={SideCardLocation.End}
      show={showSideCard}
      onClose={closeSideCard}
      className={customClassNames}
      footerClassName="justify-content-end"
      data-testid="edit-site-side-card"
      footer={
        <>
          {isDoneBtnVisible ? (
            <Button
              type="button"
              onClick={onDoneClick}
              data-testid="edit-site-done-btn"
            >
              {SiteSubmitButtonText.DONE}
            </Button>
          ) : (
            <>
              <Button
                variant={ButtonVariant.Secondary}
                onClick={closeSideCard}
                data-testid="edit-site-sidecard-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                isLoading={isSubmitLoading}
                onClick={onSubmit}
                disabled={
                  inputHasError() || (!inputIsDirty() && !isSuccessUpdateSite)
                }
                data-testid="test-update-site-button"
              >
                {handleSubmitBtnText()}
              </Button>
            </>
          )}
        </>
      }
    >
      {isUserAdmin ? (
        <TabSwitcher
          tabComponentList={[
            {
              label: siteTabs.Basic,
              children: renderEditSiteForm(),
              key: siteTabs.Basic,
            },
            {
              label: siteTabs.AccessControl,
              children: (
                <SiteACL
                  siteId={siteId}
                  userGroups={userGroups}
                  isLoading={userGroupListIsLoading}
                  totalUserGroups={userGroupListResponse?.data.total || 0}
                  selectedUserGroupsCount={selectedUserGroupsCount}
                />
              ),
              key: siteTabs.AccessControl,
            },
          ]}
          activeKey={activeTabKey}
          onTabSwitch={(tabKey) => setActiveTabKey(tabKey)}
        />
      ) : (
        renderEditSiteForm()
      )}
    </SideCard>
  );
};
