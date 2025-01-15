import { isNil } from 'lodash';
import { ImageUploadProps } from './types';
import {
  Icon,
  IconButton,
  IconButtonVariant,
  Input,
  Spinner,
} from '../../atoms';
import { ColorClass, IconIdentifier } from '../../enums';

export const ImageUpload: React.FC<ImageUploadProps> = ({
  disabled,
  name,
  onChange,
  onDelete,
  isLoading,
  onClickView,
  imageSrc,
}) => {
  return (
    <div className="image-upload-container">
      {isNil(imageSrc) ? (
        <div className="image-upload__file-input-container">
          <Input.File
            type="file"
            disabled={disabled || isLoading}
            accept=".png,.jpeg,.jpg"
            title="Upload image file"
            onChange={onChange}
            name={name}
          />
          {isLoading ? (
            <Spinner className="image-upload__file-input__spinner" />
          ) : (
            <Icon
              identifier={IconIdentifier.ImageAdd}
              className="image-upload__file-input__icon"
              colorClass={ColorClass.Neutral200}
            />
          )}
        </div>
      ) : (
        <div className="image-upload__thumbnail-container">
          <img src={imageSrc} className="image-upload__thumbnail" />
          <div
            className="image-upload__thumbnail__overlay"
            onClick={(event) => {
              onClickView?.(event);
            }}
          >
            {!disabled && (
              <IconButton
                iconIdentifier={IconIdentifier.Bin}
                variant={IconButtonVariant.Secondary}
                className="image-upload__thumbnail__overlay__delete-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete?.();
                }}
              />
            )}
            <Icon
              identifier={IconIdentifier.VisibilityOn}
              colorClass={ColorClass.White}
              size={28}
            />
          </div>
        </div>
      )}
    </div>
  );
};
