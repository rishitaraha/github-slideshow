import {
  ButtonVariant,
  ColorClass,
  Icon,
  Button,
  IconIdentifier,
  Tooltip,
  StatusIndicator,
  StatusIndicatorLevel,
  Pill,
} from '@aus-platform/design-system';
import { useGeotagImagesContext } from '../../contexts';
import { GeotagImagesModalView } from '../enum';
import { GeotagImageObj } from 'shared/api';

export const GeotagImageTableActions = ({
  rowDetails,
}: {
  rowDetails: GeotagImageObj;
}) => {
  // States.
  const {
    setShowEditGeotagImagesModal,
    onUploadImages,
    setActionSelectedGeotagImage,
    setModalPageView,
  } = useGeotagImagesContext();

  const { isImageAvailable, isGeotagDisabled, isImageDisabled } = rowDetails;

  const onClickHandler = (onClick) => {
    setActionSelectedGeotagImage(rowDetails);
    onClick;
  };

  const renderEditIcon = () => (
    <Tooltip hoverText="Edit Geotag">
      <Button
        variant={ButtonVariant.Link}
        color={ColorClass.Gray200}
        onClick={() => {
          onClickHandler(setShowEditGeotagImagesModal(true));
        }}
      >
        <Icon
          identifier={IconIdentifier.Pencil}
          colorClass={ColorClass.Primary500}
          size={12}
        />
      </Button>
    </Tooltip>
  );

  const renderImageIcon = () => {
    const hoverText = isImageAvailable
      ? 'Image available'
      : 'Image not available';

    const onClick = isImageAvailable
      ? () => {
          onClickHandler(setModalPageView(GeotagImagesModalView.Image));
        }
      : onUploadImages;

    const iconColor = isImageAvailable
      ? ColorClass.Primary500
      : ColorClass.Red500;
    const icon = isImageAvailable
      ? IconIdentifier.Image
      : IconIdentifier.ImageAdd;
    return (
      <Tooltip hoverText={hoverText}>
        <Button
          variant={ButtonVariant.Link}
          color={ColorClass.Gray200}
          onClick={onClick}
        >
          <Icon identifier={icon} colorClass={iconColor} size={12} />
        </Button>
      </Tooltip>
    );
  };

  const renderGeotagStatus = () => {
    const hoverText = isGeotagDisabled ? 'Geotag disabled' : 'Geotag enabled';

    return (
      <Tooltip hoverText={hoverText}>
        <StatusIndicator
          iconIdentifier={IconIdentifier.Geotag}
          status={
            isGeotagDisabled
              ? StatusIndicatorLevel.Failed
              : StatusIndicatorLevel.Completed
          }
          iconSize={12}
        />
      </Tooltip>
    );
  };

  const renderImageStatus = () => {
    const hoverText = isImageDisabled ? 'Image disabled' : 'Image enabled';

    return (
      <Tooltip hoverText={hoverText}>
        <StatusIndicator
          iconIdentifier={IconIdentifier.Image}
          status={
            isImageDisabled
              ? StatusIndicatorLevel.Failed
              : StatusIndicatorLevel.Completed
          }
          iconSize={12}
        />
      </Tooltip>
    );
  };

  return (
    <div className="geotag-images-modal__table-action">
      <Pill color={ColorClass.Primary200}>
        {renderImageStatus()}
        {renderGeotagStatus()}
      </Pill>
      {renderImageIcon()}
      {renderEditIcon()}
    </div>
  );
};
