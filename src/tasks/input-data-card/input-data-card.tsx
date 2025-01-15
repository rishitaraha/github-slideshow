import React from 'react';
import {
  Icon,
  IconIdentifier,
  IconPlacement,
  MeatBallsMenu,
  MeatBallsMenuDirection,
  MeatBallsSize,
  Pill,
  PillButton,
  PillButtonVariant,
  PillShape,
  PillVariant,
  Tooltip,
} from '@aus-platform/design-system';
import { useIterationDatasetContext } from '../contexts/iteration-context';
import { InputDataCardProps } from './type';
import { EnvVariables } from 'src/shared/env-variables';
import api from 'src/shared/api/api';

export const InputDataCard: React.FC<InputDataCardProps> = ({
  handleAddMoreImages,
  displayGeotagImagesModal,
  displayGCPSchemaModal,
  displayGCPUploadModal,
}) => {
  // Context
  const { iterationDataset } = useIterationDatasetContext();
  // Constants.
  const areImagesUploaded =
    iterationDataset && iterationDataset?.numberOfImages > 0;

  const handleDownloadInputData = async () => {
    const rainbowApiEngineUrl = EnvVariables.backendUrl;
    const imageZipSignedUrl = await api.get(
      rainbowApiEngineUrl +
        `/processing/iteration-dataset/${iterationDataset.id}/signed-token/`,
    );
    const signedToken = imageZipSignedUrl.data.signed_token;
    if (signedToken) {
      const inputDataZipDownloadUrl =
        rainbowApiEngineUrl +
        `/processing/iteration-dataset/${iterationDataset.id}/input-data?signed_token=` +
        signedToken;
      window.open(inputDataZipDownloadUrl, '_parent', `download`);
    }
  };
  // Render.
  const renderImagesInfo = () => {
    const totalImages = iterationDataset?.numberOfImages;

    const hoverText = areImagesUploaded ? (
      <>
        Images Present: {totalImages} <br />
        Images Enabled: {iterationDataset?.numberOfImagesEnabled ?? totalImages}
      </>
    ) : (
      'No Images uploaded'
    );

    return (
      <Tooltip hoverText={hoverText}>
        {!areImagesUploaded ? (
          <Pill
            className="input-data-card__images-info"
            variant={PillVariant.Default}
            shape={PillShape.Oval}
          >
            <Icon
              size={13}
              className="me-1"
              identifier={IconIdentifier.ImageLibrary}
            />
            No Images Uploaded
          </Pill>
        ) : (
          <PillButton
            variant={PillButtonVariant.Primary}
            iconIdentifier={IconIdentifier.ImageLibrary}
            iconPlacement={IconPlacement.Left}
          >
            {iterationDataset?.numberOfImages}
          </PillButton>
        )}
      </Tooltip>
    );
  };

  const renderGeotagPill = () => {
    const isGeotagAvailable = !!iterationDataset?.areGeotagsPresent;
    const isPreparingGeotag = !!iterationDataset?.isPreparingGeotags;
    const hoverText = isGeotagAvailable
      ? 'Geotags available'
      : 'Geotags not available';

    const pillVariant = isGeotagAvailable
      ? PillButtonVariant.Success
      : isPreparingGeotag
        ? PillButtonVariant.Warning
        : PillButtonVariant.Error;

    const pillIcon = isGeotagAvailable
      ? IconIdentifier.Geotag
      : isPreparingGeotag
        ? IconIdentifier.GeotagProcessing
        : IconIdentifier.GeotagNotPresent;

    return (
      <Tooltip hoverText={hoverText}>
        <PillButton
          variant={pillVariant}
          iconPlacement={IconPlacement.Left}
          iconIdentifier={pillIcon}
          onClick={displayGeotagImagesModal}
        >
          Geotags
        </PillButton>
      </Tooltip>
    );
  };

  const renderGcpPill = () => {
    const isGcpAvailable = Boolean(iterationDataset?.areGcpsPresent);
    const isGcpTagged = Boolean(iterationDataset?.isGcpTagged);

    let hoverText = 'GCP Tagged';
    if (!isGcpAvailable) {
      hoverText = iterationDataset
        ? 'GCP not available. upload?'
        : 'GCP not available';
    } else if (!isGcpTagged) {
      hoverText = 'GCP Untagged';
    }

    const pillVariant = isGcpAvailable
      ? isGcpTagged
        ? PillButtonVariant.Success
        : PillButtonVariant.Warning
      : PillButtonVariant.Error;

    const pillIcon = isGcpAvailable
      ? isGcpTagged
        ? IconIdentifier.GCPAvailableTagged
        : IconIdentifier.GCPAvailableUntagged
      : IconIdentifier.GCPUnavailable;

    return (
      <Tooltip hoverText={hoverText}>
        <PillButton
          variant={pillVariant}
          iconPlacement={IconPlacement.Left}
          iconIdentifier={pillIcon}
          onClick={
            isGcpAvailable ? displayGCPSchemaModal : displayGCPUploadModal
          }
        >
          GCP
        </PillButton>
      </Tooltip>
    );
  };

  const renderMeatballMenu = () => {
    return (
      <div className="input-data-card__actions">
        <MeatBallsMenu
          drop={MeatBallsMenuDirection.Down}
          size={MeatBallsSize.Large}
        >
          <MeatBallsMenu.Item onClick={handleAddMoreImages}>
            {`Add ${areImagesUploaded ? 'more' : ''} images`}
          </MeatBallsMenu.Item>
          {iterationDataset && (
            <MeatBallsMenu.Item onClick={displayGCPUploadModal}>
              Upload GCP
            </MeatBallsMenu.Item>
          )}
          {areImagesUploaded && (
            <MeatBallsMenu.Item onClick={handleDownloadInputData}>
              {`Download Input Data`}
            </MeatBallsMenu.Item>
          )}
        </MeatBallsMenu>
      </div>
    );
  };

  return (
    <>
      <div className="input-data-card">
        <span className="input-data-card__header">Input Data</span>
        <div className="input-data-card__details">
          {renderImagesInfo()}
          {renderGeotagPill()}
          {renderGcpPill()}
        </div>
        {renderMeatballMenu()}
      </div>
    </>
  );
};
